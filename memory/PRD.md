# Ambulatorio Infermieristico - PRD

## Problema Originale
Applicazione web full-stack per la gestione di un ambulatorio infermieristico con supporto per:
- Gestione pazienti (PICC e MED)
- Schede impianto e medicazione
- Agenda appuntamenti
- Generazione PDF cartelle cliniche
- Modulistica scaricabile

## Architettura
- **Backend**: FastAPI + MongoDB (pymongo)
- **Frontend**: React + Tailwind CSS + shadcn/ui
- **PDF Generation**: ReportLab

## Funzionalità Implementate

### Sessione 08/01/2026

#### Agenda - Gestione Appuntamenti
- Nome paziente più grande e visibile (font-bold text-base)
- Colorazione stato appuntamenti:
  - Nero (da_fare)
  - Verde (effettuato)
  - Rosso (non_presentato)
- Dialog di modifica al click sul nome con:
  - Cambio stato (Effettuato/Non Presentato)
  - Modifica prestazioni
  - Eliminazione appuntamento

#### Modulistica PICC Aggiornata
- Sostituito "Specifiche Impianto" con "Scheda Impianto" (nuovo PDF)
- Rinominato documenti per chiarezza

#### Scheda Impianto PICC - Nuovi Campi
- Tipo catetere: PICC, Midline, PICC Port, PORT a cath, Altro
- Campi numerici: diametro_vena_mm, profondita_cm, lunghezza_totale_cm, lunghezza_impiantata_cm, french, lumi, lotto
- Procedure: colla_hystoacrilica, ecg_intracavitario
- Motivazioni: NPT, Scarso patrimonio venoso
- Secondo operatore nel footer

### Sessioni Precedenti
- Clonazione e setup progetto
- Form Scheda Impianto PICC (versione completa e semplificata)
- Correzione errori backend (NameError, validazione Pydantic)
- Rimozione sistema codici identificativi
- Miglioramento anteprima foto
- Descrizioni automatiche foto medicazione

## Backlog / TODO

### P0 - Urgente
- Testare download PDF sezioni separate (anagrafica, medicazione, impianto, gestione)

### P1 - Importante
- Verificare stampa PDF scheda impianto con nuovi campi
- Implementare funzionalità ritaglio foto

### P2 - Nice to Have
- Separare "Gestione PICC" come sezione indipendente nel download

## Schema Database

### patients
```json
{
  "id": "uuid",
  "nome": "string",
  "cognome": "string",
  "sesso": "M/F",
  "data_nascita": "date",
  "tipo": "picc/med/picc_med",
  "ambulatorio": "pta_centro/villa_ginestre",
  "status": "in_cura/sospeso/dimesso"
}
```

### appointments
```json
{
  "id": "uuid",
  "patient_id": "uuid",
  "data": "YYYY-MM-DD",
  "ora": "HH:MM",
  "tipo": "PICC/MED",
  "prestazioni": ["array"],
  "stato": "da_fare/effettuato/non_presentato"
}
```

### schede_impianto_picc
```json
{
  "id": "uuid",
  "patient_id": "uuid",
  "scheda_type": "completa/semplificata",
  "tipo_catetere": "picc/midline/picc_port/port_a_cath/altro",
  "braccio": "dx/sn",
  "vena": "basilica/cefalica/brachiale",
  "french": "string",
  "lumi": "string",
  "diametro_vena_mm": "string",
  "lunghezza_totale_cm": "string",
  "operatore": "string",
  "secondo_operatore": "string"
}
```

## File Principali
- `/app/backend/server.py` - API, logica DB, generazione PDF
- `/app/frontend/src/components/SchedaImpiantoPICC.jsx` - Form scheda impianto
- `/app/frontend/src/pages/AgendaPage.jsx` - Agenda appuntamenti
- `/app/frontend/src/pages/ModulisticaPage.jsx` - Modulistica scaricabile
- `/app/frontend/src/pages/PatientDetailPage.jsx` - Dettaglio paziente
