/**
 @module index.js
 @author mtarkiai
 @since 2/27/15
 */

var eventstream = require('event-stream'),
    dutil       = require('./lib/util');

module.exports = function(jflo) {
    jflo.flow("analyze", function(config) {
            var params = config.params || {};
            var groupby_field_path = params.group_by || "___undefined___";
            var stats_by_group = {};
            var docs_processed = 0;
            return eventstream.through(function(data) {
                var group_id = jflo.util.fget(data, groupby_field_path) || "@uncategorized";
                var group = stats_by_group[group_id] = stats_by_group[group_id] || {};
                var flat_data = dutil.flatten('', data);
                Object.keys(flat_data).forEach(function(path) {
                    var abstract_path = path.split(dutil.PATH_SEPARATOR)
                        .map(function(part) {
                            return isNaN(part) ? part : ':idx';
                        })
                        .join(dutil.PATH_SEPARATOR);
                    group[abstract_path] = (group[abstract_path] || 0) + 1;
                })
                if (++docs_processed % 1000 == 0) {
                    config.logger.debug.write(docs_processed + " documents analyzed");
                }
            }, function() {
                // End
                this.emit('data', stats_by_group);
                this.emit('end');
            });

        },
        {
            info: {
                project: "Analyze",
                title: "Structural analysis of document streams",
                params: {
                    group_by: "Field name to group by (x.y.z)",
                }
            },
            configs: {
                $default: {
                }
            }
        })
}