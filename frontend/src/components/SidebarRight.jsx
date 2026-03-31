import EventsCard from "./EventsCard";
import InfluencerList from "./InfluencerList";
import "./fashion-home.css";

export default function SidebarRight({ creators = [] }) {
  return (
    <aside className="side-stack">
      <InfluencerList creators={creators} />
      <EventsCard />
    </aside>
  );
}
