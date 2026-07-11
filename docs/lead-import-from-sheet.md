## Lead Import from Spreadsheet (CSV / Excel)

Import leads from a `.csv`, `.xlsx`, or `.xls` file. The importer maps spreadsheet
columns to lead fields intelligently, so exact header names are **not** required.

- UI: `src/components/ui/import-leads-dialog.jsx`
- Logic: `src/hooks/use-import-leads.js`
- Column mapping (centralized, reusable, unit-tested): `src/utils/lead-import-mapping.js`
- Tests: `src/utils/__tests__/lead-import-mapping.test.js`

The backend API contract is unchanged. Each imported row is sent as:

```json
{
  "phone_number": "+201001234567",
  "user_name": "Ahmed",
  "query": "Interested after July\nBudget: 5M, City: New Cairo",
  "campaign_id": "summer_campaign",
  "platform": "website"
}
```

> Note the logical → API field names: `name → user_name`, `phone → phone_number`,
> `notes → query`. These are backend field names and must not change here.

---

### Case-insensitive matching

Header names are matched without case sensitivity. `Name`, `NAME`, `name`, and
`NaMe` all map to the same field.

### Normalization rules

Headers are normalized before matching. The following differences are ignored:

- case
- spaces
- underscores (`_`)
- hyphens (`-`)
- extra / repeated whitespace

So all of these map to `phone`: `Phone`, `phone`, `PHONE`, `Phone Number`,
`phone_number`, `Phone-Number`, `phone number`, `Mobile`.

### Supported aliases

Aliases are centralized in `LEAD_FIELD_ALIASES` (`src/utils/lead-import-mapping.js`)
and are easy to extend. Current aliases (English + Arabic):

| Field         | Aliases |
| ------------- | ------- |
| `phone` (required) | phone, phone number, mobile, mobile number, telephone, tel, contact, contact number, whatsapp, whatsapp number, number, رقم, رقم الهاتف, موبايل, تليفون |
| `name`        | name, full name, fullname, user name, username, lead name, lead, client, client name, customer, customer name, اسم, الاسم |
| `notes`       | notes, note, query, description, remarks, comment, comments, details, message, ملاحظات, وصف |
| `campaign_id` | campaign, campaign id, campaign_id, campaignid, campaign name, source campaign, source_campaign |
| `platform`    | platform, source, lead source, channel, origin |

Matching is two-phase: exact normalized matches win over fuzzy (whole-word)
matches. Each column is assigned to at most one field, and each field to at most
one column; when several columns match a field, the **leftmost** wins.

### Unknown-column handling & notes merge

Columns that don't match any known field are **not dropped**. For every row, each
unknown column with a non-empty value is turned into a `Header: value` pair and
the pairs are appended to the lead's notes (`query`), joined by `, `.

Given this spreadsheet:

| Name  | Phone  | Budget | City      | Unit Type |
| ----- | ------ | ------ | --------- | --------- |
| Ahmed | 010... | 5M     | New Cairo | Apartment |

the generated payload is:

```json
{
  "user_name": "Ahmed",
  "phone_number": "...",
  "query": "Budget: 5M, City: New Cairo, Unit Type: Apartment"
}
```

If the spreadsheet also has a Notes column, the existing note is preserved on its
own line and the generated text is appended below it:

```
Interested after July
Budget: 5M, City: New Cairo, Unit Type: Apartment
```

Empty unknown values are skipped.

### Required / recommended / optional fields

Validation is unchanged:

- **Required:** `phone` — import fails if no phone column is detected.
- **Recommended:** `name` — falls back to the phone number when missing.
- **Optional:** `notes`, `campaign_id`, `platform`.

Extra/unknown columns never fail the import — they are merged into notes.

`platform` values must be one of the allowed backend values
(`src/constants/lead-import.js` → `VALID_LEAD_PLATFORMS`); leave the column empty
to use the default (`website`). A row with an invalid platform is skipped and
reported in the summary.

### Import template

The downloadable template (`Download template` in the dialog) contains only the
recommended columns:

```
Name, Phone, Notes, Campaign ID, Platform
```

Because matching is case-insensitive and normalized, these display labels map
cleanly to the internal fields. Older templates using lowercase `snake_case`
headers (`name`, `phone`, `notes`, `campaign_id`, `platform`) and the legacy
`query` header remain fully supported.

### Preview before import

After a file is selected, the dialog shows a **column mapping preview**:

```
Phone Number  → phone      [alias]
Customer Name → name       [alias]
City          → notes      [merged]
Budget        → notes      [merged]
```

- mapped columns show `header → field`, with an `alias` badge when an alias name
  was used instead of the canonical field name;
- unknown columns show `header → notes` with a `merged` badge;
- a warning is shown when no phone column is detected.

### Examples of accepted spreadsheets

All of the following import correctly:

```
name,phone,notes,campaign_id,platform
Ahmed,+201001234567,Interested,summer,website
```

```
Full Name,Mobile,Description
Sara,01098765432,Call next week
```

```
الاسم,رقم الهاتف,ملاحظات
محمد,01000000000,مهتم
```

```
Customer Name,Phone Number,Budget,City,Unit Type
Ahmed,010...,5M,New Cairo,Apartment
```

### Running the tests

```
node --test src/utils/__tests__/lead-import-mapping.test.js
```
