import { createClient } from '@supabase/supabase-js'

const supabaseUrl ="https://dhhzzasfowqqzzebunbs.supabase.co";
const supabaseKey ="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRoaHp6YXNmb3dxcXp6ZWJ1bmJzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIwMDc0NzgsImV4cCI6MjA4NzU4MzQ3OH0.l9QRzXL0o5Mg6g4rFP3Wbmx_utX6D1Rkpnv_2tAXis0";
export const supabase = createClient(supabaseUrl, supabaseKey)