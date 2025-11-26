import { NextResponse } from 'next/server';
import { Pool } from 'pg';

// Disable caching for this dynamic route
export const dynamic = 'force-dynamic';

const pool = new Pool({
  user: process.env.POSTGRES_USER || 'mlflow',
  host: process.env.POSTGRES_HOST || 'postgres',
  database: process.env.POSTGRES_DB || 'mlflow',
  password: process.env.POSTGRES_PASSWORD || 'mlflow',
  port: 5432,
});

export async function GET() {
  try {
    // Query for best F1 score
    const f1Query = `
      SELECT m.value as f1, r.run_uuid
      FROM metrics m
      JOIN runs r ON m.run_uuid = r.run_uuid
      WHERE m.key = 'best_f1'
      ORDER BY r.start_time DESC
      LIMIT 1
    `;
    
    const client = await pool.connect();
    try {
      const res = await client.query(f1Query);
      
      if (res.rows.length > 0) {
        const bestF1 = res.rows[0].f1;
        const runUuid = res.rows[0].run_uuid;
        
        // Query for model name
        const modelQuery = `
          SELECT value FROM params 
          WHERE run_uuid = $1 AND key = 'best_model'
        `;
        const modelRes = await client.query(modelQuery, [runUuid]);
        const modelName = modelRes.rows.length > 0 ? modelRes.rows[0].value : 'Unknown';
        
        return NextResponse.json({ 
          f1: parseFloat(bestF1), 
          model: modelName,
          status: 'ready' 
        });
      } else {
        return NextResponse.json({ status: 'initializing' });
      }
    } finally {
      client.release();
    }
  } catch (error: any) {
    console.error('Database error:', error);
    // Check for "undefined table" error (SQLSTATE 42P01)
    if (error.code === '42P01') {
       return NextResponse.json({ status: 'initializing' });
    }
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }
}
