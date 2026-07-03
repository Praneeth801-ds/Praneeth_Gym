import re
import os

filepath = r"d:\My_Tasks\Gym\fitpulse-app\src\FitPulse.jsx"
with open(filepath, "r", encoding="utf-8") as f:
    content = f.read()

# 1. Add imports at the top
imports = """import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { supabase } from "./supabaseClient";
import * as api from "./api";
"""
content = re.sub(r'import React.*?;', imports, content, flags=re.DOTALL)

# 2. Delete INITIAL_CLIENTS and INITIAL_TRAINERS
# Let's find the blocks by looking for `const INITIAL_CLIENTS = [` up to `];`
# and `const INITIAL_TRAINERS = [` up to `];`
content = re.sub(r'const INITIAL_CLIENTS = \[.*?\}\s*\];', '', content, flags=re.DOTALL)
content = re.sub(r'const INITIAL_TRAINERS = \[.*?\}\s*\];', '', content, flags=re.DOTALL)

# 3. Modify handleLogin and handleRegister in AuthPage
# Actually, they are in App
app_login = """  async function handleLogin(email, password, role) {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      addToast(error.message, "error");
      return false;
    }
    return true;
  }"""
content = re.sub(r'async function handleLogin.*?return false;\s*\}', app_login, content, flags=re.DOTALL)

app_register = """  async function handleRegister({ name, email, password, role }) {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) {
      addToast(error.message, "error");
      return;
    }
    if (data?.user) {
      await api.createProfile({
        full_name: name,
        role: role,
        weight: 70,
        target_weight: 65
      });
      addToast("Registration successful!", "success");
    }
  }"""
content = re.sub(r'async function handleRegister.*?\} else \{\s*addToast.*?\s*\}\s*\}', app_register, content, flags=re.DOTALL)

# 4. Modify App component hooks
app_hooks = """export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [currentView, setCurrentView] = useState("landing");
  const [toasts, setToasts] = useState([]);
  
  const [clients, setClients] = useState([]);
  const [trainer, setTrainer] = useState({ name: "Rohan Mehta (Mock)" });

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) loadUserData();
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        loadUserData();
      } else {
        setCurrentUser(null);
        setCurrentView("landing");
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  async function loadUserData() {
    try {
      const prof = await api.getProfile();
      let userObj = {
        id: prof.id, name: prof.full_name, role: prof.role, email: "",
        trainerId: prof.trainer_id,
        profile: {
          weight: prof.weight, targetWeight: prof.target_weight,
          startDate: prof.start_date, endDate: prof.end_date, plan: prof.plan, feesPaid: prof.fees_paid
        },
        progressPhotos: [], weightLog: [], dietPlan: { assigned: false, meals: [] }, messages: []
      };

      if (prof.role === "trainer") {
        const myClientsRaw = await api.getClients();
        // Just mock mapping for now or map fully
        setClients(myClientsRaw.map(c => ({
          id: c.id, name: c.full_name, role: c.role, email: "", trainerId: c.trainer_id,
          profile: { weight: c.weight, targetWeight: c.target_weight, startDate: c.start_date, endDate: c.end_date, plan: c.plan, feesPaid: c.fees_paid },
          progressPhotos: [], weightLog: [], dietPlan: { assigned: false, meals: [] }, messages: []
        })));
      } else {
        const logs = await api.getLogs();
        const photos = await api.getPhotos();
        let diets = [];
        try { diets = await api.getDietPlan(); } catch(e){}
        
        userObj.weightLog = logs || [];
        userObj.progressPhotos = photos || [];
        userObj.dietPlan = (diets && diets.length > 0) ? diets[0] : { assigned: false, meals: [] };
      }
      
      setCurrentUser(userObj);
      setCurrentView("app");
    } catch (e) {
      console.error(e);
      setCurrentUser(null);
    }
  }

  const addToast = useCallback((msg, type = "success") => {
    const id = Date.now();
    setToasts(t => [...t, { id, msg, type }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3200);
  }, []);

  async function handleLogout() {
    await supabase.auth.signOut();
  }
"""

content = re.sub(r'export default function App\(\) \{.*?const addToast = useCallback.*?\n\s*\}, \[\]\);', app_hooks, content, flags=re.DOTALL)

# 5. Fix signout button
content = content.replace('onClick={() => { setCurrentUser(null); setCurrentView("landing"); }}>Sign Out', 'onClick={handleLogout}>Sign Out')

# 6. AuthPage error handling
content = content.replace('if (!result) setError("Invalid email or password. Try: ananya@email.com / pass (client) or rohan@fitpulse.com / pass (trainer)");', 'if (!result) setError("Login failed.");')

# Write back
with open(filepath, "w", encoding="utf-8") as f:
    f.write(content)
print("done")
