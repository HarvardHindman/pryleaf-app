# Using MCP to Manage Supabase Database

## Overview

Instead of writing migration files manually, you can use the **Supabase MCP (Model Context Protocol)** to directly interact with your database. This is faster for development and testing!

## 🔧 Available MCP Tools

I have access to these Supabase MCP tools:

### **Schema Management**
- `mcp_supabase_list_tables` - List all tables in your database
- `mcp_supabase_list_extensions` - Show installed PostgreSQL extensions
- `mcp_supabase_list_migrations` - View migration history

### **Database Operations**
- `mcp_supabase_execute_sql` - Run any SQL query (SELECT, UPDATE, etc.)
- `mcp_supabase_apply_migration` - Apply a schema migration
- `mcp_supabase_get_logs` - View application logs
- `mcp_supabase_get_advisors` - Check for security/performance issues

### **Edge Functions**
- `mcp_supabase_list_edge_functions` - List all edge functions
- `mcp_supabase_get_edge_function` - Get function code
- `mcp_supabase_deploy_edge_function` - Deploy a new function

### **Development Branches**
- `mcp_supabase_list_branches` - List dev branches
- `mcp_supabase_create_branch` - Create development branch
- `mcp_supabase_merge_branch` - Merge to production

---

## 📊 Examples

### **1. View Current Tables**

I can check your database structure anytime:

```javascript
await mcp_supabase_list_tables({ schemas: ["public"] });
```

This shows:
- All tables with columns
- Primary keys
- Foreign key relationships
- RLS (Row Level Security) status
- Column types and constraints

### **2. Execute SQL Queries**

Read data:
```javascript
await mcp_supabase_execute_sql({
  query: `
    SELECT symbol, COUNT(*) as holder_count
    FROM portfolio_holdings
    WHERE shares > 0
    GROUP BY symbol
    ORDER BY holder_count DESC
    LIMIT 10;
  `
});
```

Check cache health:
```javascript
await mcp_supabase_execute_sql({
  query: `
    SELECT 
      COUNT(*) as total_symbols,
      COUNT(*) FILTER (WHERE last_updated > NOW() - INTERVAL '1 hour') as fresh,
      COUNT(*) FILTER (WHERE last_updated <= NOW() - INTERVAL '1 hour') as stale
    FROM stock_quotes;
  `
});
```

### **3. Apply Migrations**

Instead of creating a file, apply directly:

```javascript
await mcp_supabase_apply_migration({
  name: "add_popular_symbols_function",
  query: `
    -- Function to get most popular symbols for daily refresh
    CREATE OR REPLACE FUNCTION get_popular_symbols(limit_count INTEGER DEFAULT 100)
    RETURNS TEXT[] AS $$
    BEGIN
      RETURN ARRAY(
        SELECT DISTINCT symbol
        FROM portfolio_holdings
        WHERE shares > 0
        GROUP BY symbol
        ORDER BY COUNT(*) DESC
        LIMIT limit_count
      );
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;
    
    COMMENT ON FUNCTION get_popular_symbols IS 
      'Returns most popular symbols from portfolios for daily overview refresh';
  `
});
```

### **4. Check Database Health**

Security advisors:
```javascript
await mcp_supabase_get_advisors({ type: "security" });
```

Performance issues:
```javascript
await mcp_supabase_get_advisors({ type: "performance" });
```

### **5. View Logs**

Check API logs:
```javascript
await mcp_supabase_get_logs({ service: "api" });
```

Check Postgres logs:
```javascript
await mcp_supabase_get_logs({ service: "postgres" });
```

---

## 🎯 When to Use MCP vs. Migration Files

### **Use MCP (Direct Execution)** ✅

**Good For**:
- Development and testing
- Quick data queries
- Checking database state
- One-off fixes
- Debugging issues
- Viewing logs

**Examples**:
```javascript
// Check if function exists
await mcp_supabase_execute_sql({
  query: "SELECT routine_name FROM information_schema.routines WHERE routine_name = 'bulk_upsert_stock_quotes';"
});

// Test a function
await mcp_supabase_execute_sql({
  query: "SELECT * FROM get_active_portfolio_symbols();"
});

// Check recent refresh logs
await mcp_supabase_execute_sql({
  query: "SELECT * FROM quote_refresh_log ORDER BY started_at DESC LIMIT 5;"
});
```

### **Use Migration Files** ✅

**Good For**:
- Production deployments
- Schema changes (new tables/columns)
- Version control
- Team collaboration
- Rollback capability
- CI/CD pipelines

**Examples**:
- Adding new tables
- Modifying column types
- Creating indexes
- Setting up RLS policies
- Any change that needs to be tracked

---

## 🔄 Hybrid Approach (Recommended)

### **Development Workflow**:

```
1. Development Phase:
   ├─ Use MCP to test queries/functions
   ├─ Iterate quickly
   └─ Validate results

2. Production Phase:
   ├─ Save tested SQL to migration file
   ├─ Commit to version control
   ├─ Deploy via migration system
   └─ Rollback if needed
```

### **Example Flow**:

```javascript
// Step 1: Test with MCP
await mcp_supabase_execute_sql({
  query: `
    CREATE OR REPLACE FUNCTION test_function()
    RETURNS TEXT AS $$
    BEGIN
      RETURN 'Hello World';
    END;
    $$ LANGUAGE plpgsql;
  `
});

// Step 2: Test it works
await mcp_supabase_execute_sql({
  query: "SELECT test_function();"
});

// Step 3: If it works, save to migration file
// supabase/migrations/YYYYMMDD_add_test_function.sql
```

---

## 🛠️ Practical Examples for Your App

### **Example 1: Check Quote Cache Status**

```javascript
await mcp_supabase_execute_sql({
  query: `
    SELECT 
      symbol,
      price,
      last_updated,
      EXTRACT(EPOCH FROM (NOW() - last_updated))/60 as age_minutes
    FROM stock_quotes
    ORDER BY last_updated DESC
    LIMIT 20;
  `
});
```

### **Example 2: Find Symbols Missing from Cache**

```javascript
await mcp_supabase_execute_sql({
  query: `
    SELECT DISTINCT ph.symbol
    FROM portfolio_holdings ph
    LEFT JOIN stock_quotes sq ON ph.symbol = sq.symbol
    WHERE sq.symbol IS NULL
    AND ph.shares > 0;
  `
});
```

### **Example 3: Get Refresh Statistics**

```javascript
await mcp_supabase_execute_sql({
  query: `
    SELECT 
      DATE(started_at) as date,
      COUNT(*) as total_runs,
      COUNT(*) FILTER (WHERE status = 'completed') as successful,
      COUNT(*) FILTER (WHERE status = 'failed') as failed,
      ROUND(AVG(duration_seconds), 2) as avg_duration,
      SUM(symbols_processed) as total_symbols
    FROM quote_refresh_log
    WHERE started_at > NOW() - INTERVAL '7 days'
    GROUP BY DATE(started_at)
    ORDER BY date DESC;
  `
});
```

### **Example 4: Create Index for Better Performance**

```javascript
await mcp_supabase_apply_migration({
  name: "add_portfolio_symbol_index",
  query: `
    -- Add index for faster symbol lookups
    CREATE INDEX IF NOT EXISTS idx_portfolio_holdings_symbol 
    ON portfolio_holdings(symbol) 
    WHERE shares > 0;
    
    -- Add partial index for active quotes
    CREATE INDEX IF NOT EXISTS idx_stock_quotes_fresh 
    ON stock_quotes(last_updated DESC) 
    WHERE last_updated > NOW() - INTERVAL '2 hours';
  `
});
```

### **Example 5: Clean Old Cache Data**

```javascript
await mcp_supabase_execute_sql({
  query: `
    -- Delete very old cache entries (>30 days)
    DELETE FROM stock_cache
    WHERE created_at < NOW() - INTERVAL '30 days'
    AND data_type NOT IN ('overview'); -- Keep company overviews longer
  `
});
```

---

## 🔍 Debugging with MCP

### **Common Debugging Tasks**:

**Check if migration ran**:
```javascript
await mcp_supabase_list_migrations();
```

**Verify function exists**:
```javascript
await mcp_supabase_execute_sql({
  query: "SELECT routine_name FROM information_schema.routines WHERE routine_schema = 'public';"
});
```

**Test function directly**:
```javascript
await mcp_supabase_execute_sql({
  query: "SELECT * FROM get_quote_cache_stats();"
});
```

**Check table structure**:
```javascript
await mcp_supabase_execute_sql({
  query: `
    SELECT column_name, data_type, is_nullable
    FROM information_schema.columns
    WHERE table_name = 'stock_quotes'
    ORDER BY ordinal_position;
  `
});
```

**View RLS policies**:
```javascript
await mcp_supabase_execute_sql({
  query: `
    SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
    FROM pg_policies
    WHERE tablename = 'stock_quotes';
  `
});
```

---

## 🎨 Best Practices

### **1. Always Test First**
```javascript
// Test with SELECT before running UPDATE/DELETE
await mcp_supabase_execute_sql({
  query: "SELECT * FROM stock_quotes WHERE symbol = 'AAPL';"
});

// Then run the actual operation
await mcp_supabase_execute_sql({
  query: "UPDATE stock_quotes SET price = 175.50 WHERE symbol = 'AAPL';"
});
```

### **2. Use Transactions for Complex Operations**
```javascript
await mcp_supabase_execute_sql({
  query: `
    BEGIN;
    
    -- Multiple operations
    UPDATE stock_quotes SET price = 100 WHERE symbol = 'TEST';
    INSERT INTO quote_refresh_log (...) VALUES (...);
    
    -- If all succeeded
    COMMIT;
    -- If error, automatically rolls back
  `
});
```

### **3. Add Comments**
```javascript
await mcp_supabase_apply_migration({
  name: "add_useful_function",
  query: `
    CREATE FUNCTION my_function() ...;
    
    COMMENT ON FUNCTION my_function IS 
      'Description of what this does and why';
  `
});
```

### **4. Check Advisors Regularly**
```javascript
// Weekly security check
await mcp_supabase_get_advisors({ type: "security" });

// Check for missing indexes
await mcp_supabase_get_advisors({ type: "performance" });
```

---

## 🚀 Summary

### **MCP is Perfect For**:
- ✅ Quick database queries
- ✅ Testing SQL before migrations
- ✅ Checking application state
- ✅ Debugging issues
- ✅ Viewing logs and metrics
- ✅ Rapid iteration in development

### **Migration Files are Perfect For**:
- ✅ Production deployments
- ✅ Schema changes
- ✅ Version control
- ✅ Team collaboration
- ✅ CI/CD integration

### **Use Both**:
```
Development: MCP (fast iteration)
    ↓
Testing: MCP (validate)
    ↓
Production: Migration Files (tracked & versioned)
```

---

## 🎯 Next Steps

1. **Test your database** with MCP queries
2. **Verify** the bulk quote functions are working
3. **Monitor** cache performance
4. **Iterate** quickly with MCP during development
5. **Commit** final changes to migration files

**Need help?** Just ask me to:
- "Check the quote cache status"
- "List all tables in my database"
- "Show recent refresh logs"
- "Test the bulk upsert function"
- "Check for security issues"

I can run these queries instantly using MCP! 🚀

