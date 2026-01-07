# backend/views.py
from django.shortcuts import render

def home(request):
    return render(request, "index.html")

def react_app(request):
    return render(request, "index.html")
