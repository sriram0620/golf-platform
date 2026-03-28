import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://esseqfvxrufgvsibdcfy.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVzc2VxZnZ4cnVmZ3ZzaWJkY2Z5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDcwMDMxMCwiZXhwIjoyMDkwMjc2MzEwfQ.YKq-Ayg1DKFBw4tqaFgOXDdaZGA_SCafeqmKMHnxoEg'
const supabaseAdmin = createClient(supabaseUrl, supabaseKey)

async function fix() {
  const { data: users, error: authError } = await supabaseAdmin.auth.admin.listUsers()
  if (authError) {
    console.error('Auth error:', authError)
    return
  }

  console.log('Found users:', users.users.length)
  for (const user of users.users) {
    const { error: insertError } = await supabaseAdmin.from('profiles').upsert({
      id: user.id,
      email: user.email,
      full_name: user.user_metadata?.full_name || user.email?.split('@')[0],
      role: 'subscriber'
    })
    if (insertError) {
       console.log('Error inserting profile for', user.id, insertError)
    } else {
       console.log('Upserted profile for', user.id)
    }
  }
}
fix()
