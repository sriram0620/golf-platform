import { createClient } from '@supabase/supabase-js'

const supabase = createClient('https://esseqfvxrufgvsibdcfy.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVzc2VxZnZ4cnVmZ3ZzaWJkY2Z5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ3MDAzMTAsImV4cCI6MjA5MDI3NjMxMH0.5kOXB7O5FGU1xiw38Mx7p9vJZ3RFz1gkPpK2vMPGK_M')

async function test() {
  const tables = ['profiles', 'subscriptions', 'charities', 'golf_scores', 'draws', 'winners', 'notifications']
  for (const t of tables) {
    const { error } = await supabase.from(t).select('id').limit(1)
    console.log(`${t}:`, error ? error.code : 'OK')
  }
}

test()
