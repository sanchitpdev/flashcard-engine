ALTER TABLE test_sessions
    ALTER COLUMN score_pct TYPE FLOAT8 USING score_pct::FLOAT8;
