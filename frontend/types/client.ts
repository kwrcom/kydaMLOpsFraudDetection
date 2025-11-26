/**
 * Client type definition
 * Represents a single client record from the database
 */
export interface Client {
    transdate: string;
    cst_dim_id: string;
    monthly_os_changes: number;
    monthly_phone_model_changes: number;
    last_phone_model_categorical: string;
    last_os_categorical: string;
    logins_last_7_days: number;
    logins_last_30_days: number;
    login_frequency_7d: number;
    login_frequency_30d: number;
    freq_change_7d_vs_mean: number;
    logins_7d_over_30d_ratio: number;
    avg_login_interval_30d: number;
    std_login_interval_30d: number;
    var_login_interval_30d: number;
    ewm_login_interval_7d: number;
    burstiness_login_interval: number;
    fano_factor_login_interval: number;
    zscore_avg_login_interval_7d: number;
}
