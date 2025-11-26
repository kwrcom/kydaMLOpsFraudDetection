/**
 * Transaction type definition
 * Represents a single transaction record from the database
 */
export interface Transaction {
    cst_dim_id: string;
    transdate: string;
    transdatetime: string;
    amount: number;
    docno: string;
    direction: string;
    target?: number; // Optional fraud indicator (0 or 1)
}

/**
 * Fraud Analysis Result
 * Represents the AI fraud check analysis for a transaction
 */
export interface FraudAnalysis {
    fraudProbability: number; // Вероятность мошенничества (0-100%)
    dangerLevel: 'low' | 'medium' | 'high'; // Уровень опасности
    falsePositiveProbability: number; // Вероятность ложного срабатывания (0-100%)
}
