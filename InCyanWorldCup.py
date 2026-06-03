import streamlit as st
import random
import datetime
import pandas as pd
import io

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

def init_state():
    if "available_teams" not in st.session_state:
        st.session_state.available_teams = TEAMS.copy()
    if "participants" not in st.session_state:
        st.session_state.participants = []

def draw_team():
    name = st.session_state.participant_name.strip()
    if not name:
        st.error("Please enter a participant's name.")
        return
        
    if not st.session_state.available_teams:
        st.warning("All 48 teams have been drawn!")
        return
        
    team = random.choice(st.session_state.available_teams)
    st.session_state.available_teams.remove(team)
    
    pick_number = len(st.session_state.participants) + 1
    
    st.session_state.participants.append({
        "Pick #": pick_number,
        "Participant Name": name,
        "Team Name": team["name"],
        "Flag": team["emoji"]
    })
    
    # Store success message to show next render
    st.session_state.last_drawn = f"🎉 **{name}** drew **{team['emoji']} {team['name']}**!"
    
    # Clear the input
    st.session_state.participant_name = ""

def get_csv():
    if not st.session_state.participants:
        return None
    df = pd.DataFrame(st.session_state.participants)
    return df.to_csv(index=False).encode('utf-8')

def main():
    st.set_page_config(page_title="InCyan World Cup 2026", page_icon="🏆")
    init_state()
    
    st.title("🏆 InCyan World Cup 2026")
    st.markdown(f"**{len(st.session_state.available_teams)}** teams remaining")
    
    with st.container(border=True):
        st.subheader("Next Participant")
        st.text_input("Name:", key="participant_name", placeholder="Enter participant name...", on_change=draw_team)
        st.button("Draw Team", type="primary", on_click=draw_team, use_container_width=True)
        
    if "last_drawn" in st.session_state:
        st.success(st.session_state.last_drawn)
        del st.session_state.last_drawn
        
    st.divider()
    
    col1, col2 = st.columns([1, 1])
    with col1:
        st.subheader("Drawn Participants")
    with col2:
        csv_data = get_csv()
        if csv_data:
            filename = f"InCyan_Sweepstake_{datetime.datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
            st.download_button(
                label="📥 Export CSV",
                data=csv_data,
                file_name=filename,
                mime="text/csv",
                use_container_width=True
            )
            
    if st.session_state.participants:
        # Display latest at top
        reversed_list = list(reversed(st.session_state.participants))
        df = pd.DataFrame(reversed_list)
        st.dataframe(df, use_container_width=True, hide_index=True)
    else:
        st.info("No participants have been drawn yet.")

if __name__ == "__main__":
    main()
