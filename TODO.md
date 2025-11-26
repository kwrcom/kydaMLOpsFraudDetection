# TODO List for kydaMLOpsFraudDetection

- [ ] **Verify Services**: Run `docker compose up --build` and ensure all containers become healthy (Kafka, Zookeeper, Postgres, MinIO, MLflow, Airflow, Redis, Nginx, Producer, Inference, Frontend). Add healthcheck verification scripts if needed.
- [ ] **Frontend Enhancements**: Implement error boundaries, loading states, and robust API error handling in the Next.js frontend (`frontend/app/*`). Ensure UI gracefully handles failures and shows appropriate feedback.
- [ ] **Nginx Configuration / SSL**: Review and adjust `nginx/nginx.conf` to include SSL/TLS settings (certificate paths, `listen 443 ssl;`, etc.) and ensure secure reverse proxy for the dashboard.
