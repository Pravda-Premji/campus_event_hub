import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  collection, query, where, getDocs, setDoc, updateDoc, deleteDoc, doc, addDoc 
} from "firebase/firestore";
import { auth, db } from "@/firebase";
import { signOut, deleteUser, updateEmail } from "firebase/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { LogOut, Trash2, Edit, Mail, ShieldAlert, Plus, Search } from "lucide-react";

// Removed secondary app initialization to strictly use primary auth as requested

interface UserItem {
  id: string;
  name: string;
  email: string;
  role: string;
  branch?: string;
  year?: string;
  semester?: string;
}

const SuperAdminPage = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState<UserItem[]>([]);
  
  // Search state
  const [searchEmail, setSearchEmail] = useState("");
  const [searchResult, setSearchResult] = useState<UserItem | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  // Form state
  const [form, setForm] = useState({
    name: "",
    email: "",
    role: "student",
    branch: "",
    year: "",
    semester: ""
  });

  // Modal states for replacing email
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [newEmailForm, setNewEmailForm] = useState("");

  const fetchUsers = async () => {
    try {
      // Fetch from allowed_users so newly created (but not yet signed up) users are visible
      const usersSnap = await getDocs(collection(db, "allowed_users"));
      const usersData = usersSnap.docs
        .map(d => ({ id: d.id, ...d.data() } as UserItem))
        .filter(u => u.role === "student" || u.role === "clubAdmin"); // filter out superAdmins visually
        
      setUsers(usersData);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load users");
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchEmail.trim()) return;

    try {
      setHasSearched(true);
      const q = query(collection(db, "allowed_users"), where("email", "==", searchEmail.trim()));
      const snap = await getDocs(q);
      
      if (!snap.empty) {
        setSearchResult({ id: snap.docs[0].id, ...snap.docs[0].data() } as UserItem);
      } else {
        setSearchResult(null);
      }
    } catch (error) {
      console.error("Search failed:", error);
      toast.error("Failed to search user");
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.role) {
      toast.error("Please fill all fields");
      return;
    }

    if (form.role === "superAdmin") {
      toast.error("Super Admin role cannot be created");
      return;
    }

    try {
      // Step 11: Prevent Duplicate User Creation
      const q = query(collection(db, "users"), where("email", "==", form.email));
      const snap = await getDocs(q);
      if (!snap.empty) {
        toast.error("User already exists");
        return;
      }

      // Check if already in allowed_users
      const qAllowed = query(collection(db, "allowed_users"), where("email", "==", form.email.toLowerCase().trim()));
      const snapAllowed = await getDocs(qAllowed);
      if (!snapAllowed.empty) {
        toast.error("User is already authorized");
        return;
      }

      const newUserDoc: any = {
        name: form.name,
        email: form.email.toLowerCase().trim(),
        role: form.role,
        createdAt: new Date()
      };

      if (form.role === "staffAdvisor") {
        if (!form.branch || !form.year || !form.semester) {
          toast.error("Please fill branch, year and semester for Staff Advisor");
          return;
        }
        newUserDoc.branch = form.branch;
        newUserDoc.year = form.year;
        newUserDoc.semester = form.semester;
      }

      await addDoc(collection(db, "allowed_users"), newUserDoc);

      toast.success("User added. They can now sign up and login.");
      setForm({ name: "", email: "", role: "student", branch: "", year: "", semester: "" });
      await fetchUsers();

    } catch (error: any) {
      console.error("User creation error:", error);
      toast.error(error.message);
    }
  };

  const handleDeleteUser = async (user: UserItem) => {
    if (!window.confirm(`Are you sure you want to delete ${user.email}?`)) return;

    try {
      // Step 5: Delete User Feature
      // Remove from allowed_users so they lose authorization completely
      await deleteDoc(doc(db, "allowed_users", user.id));
      
      // Also attempt to delete from users collection if they exist there
      const qUser = query(collection(db, "users"), where("email", "==", user.email));
      const snapUser = await getDocs(qUser);
      if (!snapUser.empty) {
        await deleteDoc(doc(db, "users", snapUser.docs[0].id));
      }
      // in Client SDK without Admin SDK. The prompt says deleteUser(authUser). 
      // We'll log a warning since we only have `auth.currentUser`.
      // If we attempt it on `auth.currentUser`, the super admin deletes themselves! We shouldn't do that.
      // So we will rely mainly on Firestore deletion for safety.
      
      toast.success("User deleted from Firestore!");
      setSearchResult(null);
      await fetchUsers();
    } catch (error: any) {
      console.error(error);
      toast.error("Error deleting user: " + error.message);
    }
  };

  const handleChangeRole = async (user: UserItem) => {
    if (user.role === "superAdmin") {
      toast.error("Super Admin role cannot be modified");
      return;
    }
    const newRole = user.role === "student" ? "clubAdmin" : "student";
    // Step 7: Change Role Feature
    try {
      await updateDoc(doc(db, "allowed_users", user.id), {
        role: newRole
      });
      // Synchronize to users collection if they've already signed up
      const qUser = query(collection(db, "users"), where("email", "==", user.email));
      const snapUser = await getDocs(qUser);
      if (!snapUser.empty) {
        await updateDoc(doc(db, "users", snapUser.docs[0].id), { role: newRole });
      }

      toast.success(`Role changed to ${newRole}`);
      if (searchResult?.id === user.id) {
        setSearchResult({ ...searchResult, role: newRole });
      }
      await fetchUsers();
    } catch (err) {
      console.error(err);
      toast.error("Failed to change role");
    }
  };

  const handleReplaceEmail = async (userId: string) => {
    if (!newEmailForm.trim()) return;

    try {
      // Step 6: Update Email Feature
      await updateDoc(doc(db, "allowed_users", userId), {
        email: newEmailForm.trim()
      });
      // Synchronize to users collection if they've already signed up
      if (searchResult?.email) {
        const qUser = query(collection(db, "users"), where("email", "==", searchResult.email));
        const snapUser = await getDocs(qUser);
        if (!snapUser.empty) {
          await updateDoc(doc(db, "users", snapUser.docs[0].id), { email: newEmailForm.trim() });
        }
      }

      toast.success("Email updated in records successfully");
      setEditingUserId(null);
      setNewEmailForm("");
      if (searchResult?.id === userId) {
        setSearchResult({ ...searchResult, email: newEmailForm.trim() });
      }
      await fetchUsers();
    } catch (err) {
      console.error(err);
      toast.error("Failed to update email");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-red-900 px-6 py-4 flex justify-between items-center text-white">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-6 h-6" />
          <span className="font-bold text-lg">Super Admin Portal</span>
        </div>
        <button
          onClick={async () => {
            await signOut(auth);
            navigate("/login");
          }}
          className="hover:text-red-200 transition-colors"
        >
          <LogOut />
        </button>
      </header>

      <div className="p-6 max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* LEFT COLUMN: Add User & Search */}
        <div className="space-y-6">
          
          {/* SEARCH USER */}
          <div className="bg-white p-6 rounded-xl shadow-sm border">
            <h2 className="text-xl font-bold mb-4 text-slate-800">Search User</h2>
            <form onSubmit={handleSearch} className="flex gap-2">
              <Input
                placeholder="Search by Email..."
                value={searchEmail}
                onChange={e => setSearchEmail(e.target.value)}
                className="flex-1"
              />
              <Button type="submit" variant="secondary">
                <Search className="w-4 h-4" />
              </Button>
            </form>

            {hasSearched && (
              <div className="mt-4">
                {searchResult ? (
                  <div className="p-4 border border-blue-100 bg-blue-50/50 rounded-lg">
                    <p className="font-semibold text-slate-800">{searchResult.name}</p>
                    <p className="text-slate-600 text-sm">{searchResult.email}</p>
                    <span className="inline-block mt-1 bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded font-medium">
                      {searchResult.role}
                    </span>
                    
                    <div className="flex gap-2 mt-4">
                      <Button size="sm" variant="outline" className="text-red-600 border-red-200 hover:bg-red-50" onClick={() => handleDeleteUser(searchResult)}>
                        <Trash2 className="w-3 h-3 mr-1" /> Delete
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleChangeRole(searchResult)}>
                        <Edit className="w-3 h-3 mr-1" /> Role
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setEditingUserId(searchResult.id)}>
                        <Mail className="w-3 h-3 mr-1" /> Email
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 bg-slate-100 text-slate-500 rounded-lg text-center text-sm">
                    User not found in system
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ADD USER */}
          <div className="bg-white p-6 rounded-xl shadow-sm border">
            <h2 className="text-xl font-bold mb-4 text-slate-800 flex items-center gap-2">
              <Plus className="w-5 h-5" /> Add New User
            </h2>
            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-700">Full Name</label>
                <Input placeholder="John Doe" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
              </div>
              
              <div>
                <label className="text-sm font-medium text-slate-700">Email Address</label>
                <Input type="email" placeholder="john@example.com" value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700 block mb-1">Role</label>
                <select 
                  className="w-full border rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-slate-900 outline-none"
                  value={form.role}
                  onChange={e => setForm({...form, role: e.target.value})}
                >
                  <option value="student">Student</option>
                  <option value="clubAdmin">Club Admin</option>
                  <option value="staffAdvisor">Staff Advisor</option>
                </select>
              </div>

              {form.role === "staffAdvisor" && (
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-slate-700">Branch</label>
                    <Input placeholder="e.g. Computer Science" value={form.branch} onChange={e => setForm({...form, branch: e.target.value})} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-slate-700">Year</label>
                      <Input placeholder="e.g. 3rd Year" value={form.year} onChange={e => setForm({...form, year: e.target.value})} />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-slate-700">Semester</label>
                      <Input placeholder="e.g. 6th" value={form.semester} onChange={e => setForm({...form, semester: e.target.value})} />
                    </div>
                  </div>
                </div>
              )}

              <Button type="submit" className="w-full bg-slate-900 text-white hover:bg-slate-800">
                Create User
              </Button>
            </form>
          </div>
        </div>

        {/* RIGHT COLUMN: Users Table */}
        <div className="lg:col-span-2">
          <div className="bg-white p-6 rounded-xl shadow-sm border h-full">
            <h2 className="text-xl font-bold mb-4 text-slate-800">Users Registry</h2>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-slate-50 text-slate-600 border-b">
                  <tr>
                    <th className="px-4 py-3 font-medium rounded-tl-lg">Name</th>
                    <th className="px-4 py-3 font-medium">Email</th>
                    <th className="px-4 py-3 font-medium">Role</th>
                    <th className="px-4 py-3 font-medium rounded-tr-lg">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {users.map(user => (
                    <tr key={user.id} className="hover:bg-slate-50/50">
                      <td className="px-4 py-4 font-medium text-slate-800">{user.name}</td>
                      <td className="px-4 py-4 text-slate-600">
                        {editingUserId === user.id ? (
                          <div className="flex items-center gap-2">
                            <Input 
                              defaultValue={user.email} 
                              onChange={(e) => setNewEmailForm(e.target.value)} 
                              className="h-8 text-xs w-48"
                            />
                            <Button size="sm" onClick={() => handleReplaceEmail(user.id)} className="h-8 px-2">Save</Button>
                            <Button size="sm" variant="ghost" onClick={() => setEditingUserId(null)} className="h-8 px-2">Cancel</Button>
                          </div>
                        ) : (
                          user.email
                        )}
                      </td>
                      <td className="px-4 py-4">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          user.role === 'student' ? 'bg-green-100 text-green-800' : 'bg-purple-100 text-purple-800'
                        }`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-slate-400 hover:text-blue-600 hover:bg-blue-50" onClick={() => setEditingUserId(user.id)} title="Replace Email">
                            <Mail className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-slate-400 hover:text-orange-600 hover:bg-orange-50" onClick={() => handleChangeRole(user)} title="Change Role">
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-slate-400 hover:text-red-600 hover:bg-red-50" onClick={() => handleDeleteUser(user)} title="Delete User">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {users.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-4 py-8 text-center text-slate-500">
                        No users found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SuperAdminPage;
