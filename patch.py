import re

# Fix main.py
main_file = r"d:\My_Tasks\Gym\fitpulse-backend\main.py"
with open(main_file, "r", encoding="utf-8") as f:
    main_content = f.read()

main_content = main_content.replace("""    raise HTTPException(status_code=404, detail="Profile not found")
    raise HTTPException(status_code=404, detail="Profile not found")""", '    raise HTTPException(status_code=404, detail="Profile not found")')

with open(main_file, "w", encoding="utf-8") as f:
    f.write(main_content)

# Update api.js
api_file = r"d:\My_Tasks\Gym\fitpulse-app\src\api.js"
with open(api_file, "r", encoding="utf-8") as f:
    api_content = f.read()

if "export const getTrainers" not in api_content:
    api_content += "\nexport const getTrainers = () => api.get('/trainers').then(r => r.data);"
    api_content += "\nexport const getTrainerInfo = (id) => api.get('/trainers/' + id).then(r => r.data);"
    with open(api_file, "w", encoding="utf-8") as f:
        f.write(api_content)

# Update FitPulse.jsx
fp_file = r"d:\My_Tasks\Gym\fitpulse-app\src\FitPulse.jsx"
with open(fp_file, "r", encoding="utf-8") as f:
    fp_content = f.read()

# 1. AuthPage: fetch trainers and show dropdown
auth_page_start = fp_content.find("function AuthPage({ onLogin, onRegister, onBack }) {")
if auth_page_start != -1:
    old_auth = """  const [mode, setMode] = useState("login");
  const [role, setRole] = useState("client");
  const [form, setForm] = useState({ name: "", email: "", password: "", confirm: "" });"""
    
    new_auth = """  const [mode, setMode] = useState("login");
  const [role, setRole] = useState("client");
  const [form, setForm] = useState({ name: "", email: "", password: "", confirm: "", trainerId: "" });
  const [trainers, setTrainers] = useState([]);

  useEffect(() => {
    if (mode === "register" && role === "client") {
      api.getTrainers().then(setTrainers).catch(console.error);
    }
  }, [mode, role]);"""
    fp_content = fp_content.replace(old_auth, new_auth)
    
    # handleRegister call
    fp_content = fp_content.replace('await onRegister({ name: form.name, email: form.email, password: form.password, role });', 'await onRegister({ name: form.name, email: form.email, password: form.password, role, trainerId: form.trainerId });')

    # Dropdown UI
    dropdown = """{role === "client" && (
            <div className="form-group" style={{ marginTop: 16 }}>
              <label className="form-label">Select a Trainer</label>
              <select className="form-input" value={form.trainerId} onChange={e => set("trainerId", e.target.value)}>
                <option value="">No Trainer (Self-Guided)</option>
                {trainers.map(t => <option key={t.id} value={t.id}>{t.full_name}</option>)}
              </select>
            </div>
          )}"""
    
    # insert before password in register mode
    fp_content = fp_content.replace('<div className="form-group">\n            <label className="form-label">Password</label>', dropdown + '\n          <div className="form-group">\n            <label className="form-label">Password</label>')

# 2. App component handleRegister to pass trainerId
app_register_old = """  async function handleRegister({ name, email, password, role }) {
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
      });"""

app_register_new = """  async function handleRegister({ name, email, password, role, trainerId }) {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) {
      addToast(error.message, "error");
      return;
    }
    if (data?.user) {
      await api.createProfile({
        full_name: name,
        role: role,
        trainer_id: trainerId || null,
        weight: 70,
        target_weight: 65
      });"""
fp_content = fp_content.replace(app_register_old, app_register_new)

# 3. App component loadUserData mock trainer removal
load_user_data_old = """const [trainer, setTrainer] = useState({ name: "Rohan Mehta (Mock)" });"""
load_user_data_new = """const [trainer, setTrainer] = useState({ name: "No Trainer Assigned" });"""
fp_content = fp_content.replace(load_user_data_old, load_user_data_new)

# 4. App component loadUserData fetch real trainer
fetch_trainer_old = """        userObj.progressPhotos = photos || [];
        userObj.dietPlan = (diets && diets.length > 0) ? diets[0] : { assigned: false, meals: [] };
      }
      
      setCurrentUser(userObj);"""

fetch_trainer_new = """        userObj.progressPhotos = photos || [];
        userObj.dietPlan = (diets && diets.length > 0) ? diets[0] : { assigned: false, meals: [] };
        
        if (prof.trainer_id) {
          const tInfo = await api.getTrainerInfo(prof.trainer_id);
          setTrainer({ id: tInfo.id, name: tInfo.full_name });
        }
      }
      
      setCurrentUser(userObj);"""
fp_content = fp_content.replace(fetch_trainer_old, fetch_trainer_new)


with open(fp_file, "w", encoding="utf-8") as f:
    f.write(fp_content)

print("done")
