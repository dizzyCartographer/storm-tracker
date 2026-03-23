# Architecture

## High-Level Design

```
[Data Sources] → [Ingestion Layer] → [Store] → [API] → [UI / Alerts]
```

## Layers

### Ingestion
Fetches and normalizes data from external weather APIs. Lives in `src/ingestion/`.

### Store
Persists storm records and tracks. Schema and migrations live in `src/store/`.

### API
Exposes storm data to clients. Lives in `src/api/`.

### UI
Web-based visualization of storm tracks. Lives in `src/ui/`.

### Alerts
Evaluates rules and dispatches notifications. Lives in `src/alerts/`.

## Key Decisions

_Record decisions here as they are made. Include the rationale and alternatives considered._

| Decision | Choice | Rationale |
|----------|--------|-----------|
| (TBD)    |        |           |
