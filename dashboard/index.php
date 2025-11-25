<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Fraud Detection Dashboard</title>
    <meta http-equiv="refresh" content="5"> <!-- Auto refresh every 5s -->
    <style>
        body { font-family: sans-serif; margin: 20px; background: #f4f4f9; }
        .container { max-width: 1200px; margin: 0 auto; }
        .card { background: white; padding: 20px; margin-bottom: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        h1, h2 { color: #333; }
        table { width: 100%; border-collapse: collapse; margin-top: 10px; }
        th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
        th { background: #f8f9fa; }
        .fraud { color: red; font-weight: bold; }
        .metric { font-size: 1.2em; margin-right: 20px; }
        .metric span { font-weight: bold; color: #007bff; }
    </style>
</head>
<body>
<div class="container">
    <h1>🛡️ Anti-Fraud MVP Dashboard</h1>

    <!-- Training Stats Section -->
    <div class="card">
        <h2>🏆 Best Model Performance (from MLflow)</h2>
        <?php
        $pg_host = getenv('POSTGRES_HOST') ?: 'postgres';
        $pg_db = getenv('POSTGRES_DB') ?: 'mlflow';
        $pg_user = getenv('POSTGRES_USER') ?: 'mlflow';
        $pg_pass = getenv('POSTGRES_PASSWORD') ?: 'mlflow';

        try {
            $dsn = "pgsql:host=$pg_host;port=5432;dbname=$pg_db;";
            $pdo = new PDO($dsn, $pg_user, $pg_pass, [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);

            // Query to find the latest run with 'best_f1' metric
            // Note: MLflow schema is complex. This is a simplified query assuming we can find metrics.
            // A robust query joins runs, metrics, and params.
            // For MVP, let's try to fetch the latest metric value for 'best_f1'.
            
            $sql = "
                SELECT m.value as f1, r.run_uuid
                FROM metrics m
                JOIN runs r ON m.run_uuid = r.run_uuid
                WHERE m.key = 'best_f1'
                ORDER BY r.start_time DESC
                LIMIT 1
            ";
            
            $stmt = $pdo->query($sql);
            $row = $stmt->fetch(PDO::FETCH_ASSOC);

            if ($row) {
                echo "<div class='metric'>Best F1 Score: <span>" . number_format($row['f1'], 4) . "</span></div>";
                
                // Try to get model name from params
                $run_uuid = $row['run_uuid'];
                $sql_param = "SELECT value FROM params WHERE run_uuid = '$run_uuid' AND key = 'best_model'";
                $stmt_param = $pdo->query($sql_param);
                $row_param = $stmt_param->fetch(PDO::FETCH_ASSOC);
                $model_name = $row_param ? $row_param['value'] : 'Unknown';
                
                echo "<div class='metric'>Model: <span>$model_name</span></div>";
            } else {
                echo "<p>No training metrics found yet.</p>";
            }

        } catch (PDOException $e) {
            echo "<p style='color:red'>Database Error: " . $e->getMessage() . "</p>";
        }
        ?>
    </div>

    <!-- Real-time Predictions Section -->
    <div class="card">
        <h2>⚡ Real-time Predictions (Last 20)</h2>
        <table>
            <thead>
                <tr>
                    <th>Time</th>
                    <th>Transaction ID</th>
                    <th>Amount</th>
                    <th>Score</th>
                    <th>Status</th>
                </tr>
            </thead>
            <tbody>
            <?php
            $redis_host = getenv('REDIS_HOST') ?: 'redis';
            $redis_port = getenv('REDIS_PORT') ?: 6379;

            try {
                $redis = new Redis();
                $redis->connect($redis_host, $redis_port);
                
                $list = $redis->lRange('recent_predictions', 0, 19);
                
                foreach ($list as $item) {
                    $txn = json_decode($item, true);
                    $is_fraud = $txn['pred_label'] == 1;
                    $class = $is_fraud ? 'fraud' : '';
                    $status = $is_fraud ? 'FRAUD' : 'OK';
                    $score = number_format($txn['pred_proba'] ?? 0, 4);
                    $amount = number_format($txn['amount'], 2);
                    $id = $txn['transaction_id'] ?? $txn['txn_id'] ?? 'N/A';
                    $time = $txn['timestamp'] ?? 'N/A';

                    echo "<tr class='$class'>";
                    echo "<td>$time</td>";
                    echo "<td>$id</td>";
                    echo "<td>$$amount</td>";
                    echo "<td>$score</td>";
                    echo "<td>$status</td>";
                    echo "</tr>";
                }
            } catch (Exception $e) {
                echo "<tr><td colspan='5' style='color:red'>Redis Error: " . $e->getMessage() . "</td></tr>";
            }
            ?>
            </tbody>
        </table>
    </div>
</div>
</body>
</html>
