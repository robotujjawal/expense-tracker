# Ledger — Django + HTML/CSS/JS Expense Tracker
# Expense Tracker

A modern Django-based Expense Tracker application.

## 🚀 Live Demo

👉 [View Live Project](https://expense-tracker-p9lm.onrender.com)

## 🛠️ Tech Stack

- Python
- Django
- Django REST Framework
- HTML
- CSS
- JavaScript
- PostgreSQL

A personal expense tracker with a Django REST API backend and a plain
HTML/CSS/JS frontend (no framework, no build step). The UI is styled like
a paper accounting ledger with a receipt-style balance card.

```
expense_tracker/
├── manage.py
├── requirements.txt
├── expense_tracker/        # Django project (settings, urls)
└── tracker/                # Django app (models, API views)
frontend/
├── index.html
├── css/style.css
└── js/
    ├── api.js               # fetch() wrapper around the REST API
    └── app.js                # UI state, rendering, chart
```

## 1. Backend setup (Django)

```bash
cd expense_tracker
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate

pip install -r requirements.txt

python manage.py migrate        # creates db.sqlite3 + seeds default categories
python manage.py createsuperuser  # optional, for /admin/

python manage.py runserver
```

The API will be live at `http://127.0.0.1:8000/api/`.

Key endpoints:
| Method | URL                          | Purpose                        |
|--------|-------------------------------|---------------------------------|
| GET/POST | `/api/transactions/`        | List / create transactions      |
| GET/PUT/DELETE | `/api/transactions/<id>/` | Retrieve / update / delete   |
| GET/POST | `/api/categories/`          | List / create categories        |
| GET    | `/api/summary/`              | Totals + category breakdown     |

`transactions/` supports query params: `?type=expense|income`,
`?category=<id>`, `?search=<text>`.

## 2. Frontend setup

The frontend is fully static — no npm, no bundler. Just open it with any
local server (opening the file directly also works, but a local server
avoids some browsers blocking `fetch` on `file://` URLs):

```bash
cd frontend
python -m http.server 5500
```

Then visit `http://127.0.0.1:5500`.

If your Django server runs on a different host/port, update `BASE_URL` in
`frontend/js/api.js`.

CORS is already enabled on the Django side (`django-cors-headers`,
`CORS_ALLOW_ALL_ORIGINS = True` in `settings.py`) so the two servers can
talk to each other during development. Tighten this before deploying.

## 3. What's included

- **Models**: `Category` (name, kind, icon, color) and `Transaction`
  (title, amount, type, category, date, notes).
- **Seeded categories**: common expense/income categories are created
  automatically by a data migration (`0002_default_categories.py`).
- **Summary endpoint**: returns income total, expense total, balance, and
  a per-category expense breakdown used to draw the doughnut chart.
- **Frontend**: add/delete transactions, filter by type, search by title,
  category breakdown chart (Chart.js via CDN), receipt-style balance card.

## 4. Next steps you might want to add

- User accounts / authentication so each user has their own ledger.
- Monthly view + date-range filtering.
- Editing an existing transaction (currently add + delete only).
- Deploy backend (Render/Railway) and frontend (Netlify/Vercel) separately.
