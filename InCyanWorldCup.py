import tkinter as tk
from tkinter import messagebox, ttk
import random
import csv
import os
import datetime

TEAMS = [
    {"name": 'United States', "emoji": '🇺🇸'},
    {"name": 'Canada', "emoji": '🇨🇦'},
    {"name": 'Mexico', "emoji": '🇲🇽'},
    {"name": 'Ecuador', "emoji": '🇪🇨'},
    {"name": 'Senegal', "emoji": '🇸🇳'},
    {"name": 'Netherlands', "emoji": '🇳🇱'},
    {"name": 'England', "emoji": '🏴󠁧󠁢󠁥󠁮󠁧󠁿'},
    {"name": 'Iran', "emoji": '🇮🇷'},
    {"name": 'Argentina', "emoji": '🇦🇷'},
    {"name": 'Saudi Arabia', "emoji": '🇸🇦'},
    {"name": 'France', "emoji": '🇫🇷'},
    {"name": 'Australia', "emoji": '🇦🇺'},
    {"name": 'Tunisia', "emoji": '🇹🇳'},
    {"name": 'Spain', "emoji": '🇪🇸'},
    {"name": 'Germany', "emoji": '🇩🇪'},
    {"name": 'Japan', "emoji": '🇯🇵'},
    {"name": 'Belgium', "emoji": '🇧🇪'},
    {"name": 'Morocco', "emoji": '🇲🇦'},
    {"name": 'Croatia', "emoji": '🇭🇷'},
    {"name": 'Brazil', "emoji": '🇧🇷'},
    {"name": 'Switzerland', "emoji": '🇨🇭'},
    {"name": 'Portugal', "emoji": '🇵🇹'},
    {"name": 'Ghana', "emoji": '🇬🇭'},
    {"name": 'Uruguay', "emoji": '🇺🇾'},
    {"name": 'South Korea', "emoji": '🇰🇷'},
    {"name": 'Cape Verde', "emoji": '🇨🇻'},
    {"name": 'Curaçao', "emoji": '🇨🇼'},
    {"name": 'Jordan', "emoji": '🇯🇴'},
    {"name": 'Uzbekistan', "emoji": '🇺🇿'},
    {"name": 'Qatar', "emoji": '🇶🇦'},
    {"name": 'DR Congo', "emoji": '🇨🇩'},
    {"name": 'Haiti', "emoji": '🇭🇹'},
    {"name": 'Iraq', "emoji": '🇮🇶'},
    {"name": 'Austria', "emoji": '🇦🇹'},
    {"name": 'Norway', "emoji": '🇳🇴'},
    {"name": 'Scotland', "emoji": '🏴󠁧󠁢󠁳󠁣󠁴󠁿'},
    {"name": 'Turkey', "emoji": '🇹🇷'},
    {"name": 'Czech Republic', "emoji": '🇨🇿'},
    {"name": 'New Zealand', "emoji": '🇳🇿'},
    {"name": 'Paraguay', "emoji": '🇵🇾'},
    {"name": 'South Africa', "emoji": '🇿🇦'},
    {"name": 'Algeria', "emoji": '🇩🇿'},
    {"name": 'Bosnia and Herzegovina', "emoji": '🇧🇦'},
    {"name": 'Ivory Coast', "emoji": '🇨🇮'},
    {"name": 'Colombia', "emoji": '🇨🇴'},
    {"name": 'Egypt', "emoji": '🇪🇬'},
    {"name": 'Panama', "emoji": '🇵🇦'},
    {"name": 'Sweden', "emoji": '🇸🇪'}
]

class SweepstakeApp:
    def __init__(self, root):
        self.root = root
        self.root.title("InCyan World Cup 2026")
        self.root.geometry("600x500")
        self.root.configure(bg="#f8fafc")

        self.available_teams = TEAMS.copy()
        self.participants = []

        # Header
        header_frame = tk.Frame(root, bg="#f8fafc")
        header_frame.pack(pady=20)
        
        tk.Label(header_frame, text="🏆 InCyan World Cup 2026", font=("Helvetica", 24, "bold"), bg="#f8fafc", fg="#0f172a").pack()
        self.progress_label = tk.Label(header_frame, text=f"{len(self.available_teams)} teams remaining", font=("Helvetica", 12), bg="#f8fafc", fg="#64748b")
        self.progress_label.pack()

        # Input Area
        input_frame = tk.Frame(root, bg="#ffffff", padx=20, pady=20, relief="solid", bd=1)
        input_frame.config(highlightbackground="#e2e8f0", highlightcolor="#e2e8f0", highlightthickness=1)
        input_frame.pack(padx=20, fill="x")

        tk.Label(input_frame, text="Next Participant:", font=("Helvetica", 12, "bold"), bg="#ffffff", fg="#334155").pack(anchor="w", pady=(0,5))
        
        self.name_var = tk.StringVar()
        self.name_entry = ttk.Entry(input_frame, textvariable=self.name_var, font=("Helvetica", 12))
        self.name_entry.pack(fill="x", ipady=8, pady=(0, 10))
        self.name_entry.bind('<Return>', lambda e: self.draw_team())

        self.draw_button = tk.Button(input_frame, text="Draw Team", font=("Helvetica", 12, "bold"), bg="#4f46e5", fg="white", 
                                     activebackground="#4338ca", activeforeground="white", command=self.draw_team, relief="flat", pady=10)
        self.draw_button.pack(fill="x")

        # Results area
        results_frame = tk.Frame(root, bg="#f8fafc")
        results_frame.pack(padx=20, pady=20, fill="both", expand=True)

        list_header_frame = tk.Frame(results_frame, bg="#f8fafc")
        list_header_frame.pack(fill="x", pady=(0, 10))
        
        tk.Label(list_header_frame, text="Drawn Participants:", font=("Helvetica", 14, "bold"), bg="#f8fafc", fg="#1e293b").pack(side="left")
        
        self.export_button = tk.Button(list_header_frame, text="Export CSV", font=("Helvetica", 10, "bold"), bg="#10b981", fg="white", 
                                       command=self.export_csv, relief="flat", padx=10)
        self.export_button.pack(side="right")

        # Table
        columns = ("pick", "name", "team")
        self.tree = ttk.Treeview(results_frame, columns=columns, show="headings", height=8)
        self.tree.heading("pick", text="Pick #")
        self.tree.column("pick", width=60, anchor="center")
        self.tree.heading("name", text="Participant Name")
        self.tree.column("name", width=200)
        self.tree.heading("team", text="Team")
        self.tree.column("team", width=250)
        
        scrollbar = ttk.Scrollbar(results_frame, orient="vertical", command=self.tree.yview)
        self.tree.configure(yscrollcommand=scrollbar.set)
        
        self.tree.pack(side="left", fill="both", expand=True)
        scrollbar.pack(side="right", fill="y")
        
    def draw_team(self):
        name = self.name_var.get().strip()
        if not name:
            messagebox.showwarning("Input Required", "Please enter a participant's name.")
            return
            
        if not self.available_teams:
            messagebox.showinfo("Draw Complete", "All 48 teams have been drawn!")
            return
            
        team = random.choice(self.available_teams)
        self.available_teams.remove(team)
        
        pick_number = len(self.participants) + 1
        
        self.participants.append({
            "pick": pick_number,
            "name": name,
            "team_name": team["name"],
            "emoji": team["emoji"]
        })
        
        # Display latest at top
        display_text = f"{team['emoji']} {team['name']}"
        self.tree.insert("", 0, values=(pick_number, name, display_text))
        
        self.name_var.set("")
        self.name_entry.focus()
        
        self.progress_label.config(text=f"{len(self.available_teams)} teams remaining")
        
        if not self.available_teams:
            messagebox.showinfo("Complete!", "The sweepstake is complete. All 48 teams have been drawn.")

    def export_csv(self):
        if not self.participants:
            messagebox.showinfo("No Data", "No participants have been drawn yet.")
            return
            
        filename = f"InCyan_Sweepstake_{datetime.datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
        try:
            with open(filename, 'w', newline='', encoding='utf-8') as f:
                writer = csv.writer(f)
                writer.writerow(["Pick #", "Participant Name", "Team Name", "Flag"])
                for p in self.participants:
                    writer.writerow([p["pick"], p["name"], p["team_name"], p["emoji"]])
            
            messagebox.showinfo("Export Success", f"Successfully exported to {filename}\n\n(Saved in the same directory as this script)")
        except Exception as e:
            messagebox.showerror("Export Error", f"Failed to export CSV:\n{str(e)}")

if __name__ == "__main__":
    # Apply some basic styling
    root = tk.Tk()
    style = ttk.Style()
    style.theme_use("clam")
    style.configure("Treeview", font=("Helvetica", 11), rowheight=30)
    style.configure("Treeview.Heading", font=("Helvetica", 12, "bold"))
    
    app = SweepstakeApp(root)
    root.mainloop()
