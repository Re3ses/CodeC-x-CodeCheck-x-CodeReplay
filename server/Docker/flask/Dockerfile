FROM python:3.10-slim
WORKDIR /app

# Install PyTorch first in its own layer
COPY torch-requirements.txt .
RUN pip install --no-cache-dir -r torch-requirements.txt

# Then install other requirements
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Set environment variables
ENV PYTHONUNBUFFERED=1

# Expose port
EXPOSE 5000

# Run the application
CMD ["gunicorn", "--timeout", "120", "--bind", "0.0.0.0:5000", "app:app"]