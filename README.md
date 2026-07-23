# 🌧️ Rainfall Predictor Web Application

A modern Django web application that leverages a pre-trained **XGBoost** machine learning model (`models/xgboost_model.joblib`) to predict rainfall. Built with **Tailwind CSS** for modern responsive styling and **GSAP** for smooth UI animations.

---

## 🛠️ Tech Stack

- **Backend**: Python 3, Django 6.0+
- **Machine Learning**: XGBoost, Scikit-learn, Joblib, Pandas, NumPy
- **Styling**: Tailwind CSS (via `@tailwindcss/cli`)
- **Animations**: GSAP (GreenSock Animation Platform)

---

## 🚀 Getting Started

### 1. Prerequisites
- Python 3.10+
- Node.js & npm

### 2. Python Virtual Environment Setup

Activate the virtual environment and install Python dependencies:

```bash
# Windows PowerShell
.\venv\Scripts\activate

# Install requirements
pip install -r requirements.txt
```

### 3. Front-End Setup & Tailwind CSS Build

Install npm packages and build the compiled Tailwind CSS stylesheet:

```bash
# Install npm dependencies
npm install

# Build compiled CSS file once
npm run build:css

# (Optional) Watch for live CSS changes during development
npm run watch:css
```

### 4. Run Django Development Server

Apply database migrations and start the dev server:

```bash
python manage.py migrate
python manage.py runserver
```

Open your browser and navigate to `http://127.0.0.1:8000/`.

---

## 📁 Project Structure

```text
rainfall_predictor/
├── models/
│   ├── xgboost_model.joblib              # Pre-trained ML model file
│   └── Binary_Prediction_with_Rainfall_Dataset.ipynb
├── predictor/                           # Django App
│   ├── static/
│   │   └── css/
│   │       ├── input.css                 # Tailwind source file
│   │       └── output.css                # Compiled production CSS
│   ├── templates/
│   │   ├── base.html                     # Base HTML shell with Tailwind & GSAP
│   │   └── predictor/
│   │       └── index.html                # App homepage with GSAP animations
│   ├── urls.py
│   └── views.py
├── rainfall_project/                     # Django Project Configuration
│   ├── settings.py
│   └── urls.py
├── .gitignore
├── manage.py
├── package.json
└── requirements.txt
```
