# jflo-analyze

Structural analysis filter for JFlo; computes attribute existence counts across a range of documents.
  
## Usage

```npm install -g skydom-io/jflo```

```npm install skydom-io/jflo-analyze```

**pets.[ndjson] (https://github.com/ndjson/ndjson-spec)** =>

```json
{ "category": "dog", "name": "Spot", "age": 10 }
{ "category": "dog", "name": "Reef", "color": "brown"}
{ "category": "cat", "name": "Kitty" }
```

```cat pets.ndjson | jflo analyze --group_by=category```

=> 

```json
{
    "dog": {
        "@document_count": 2,
        "category": 2,
        "name": 2,
        "age": 1,
        "color": 1
    },
    "cat": {
        "@document_count": 1,
        "category": 1,
        "name": 1
    }
}
```