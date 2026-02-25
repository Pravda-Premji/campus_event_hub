import { useParams, useNavigate } from "react-router-dom";

const mockEvents = [
  {
    id: "1",
    title: "Hackathon 2026",
    description: "24 hour coding competition.",
    posterUrl: "https://images.unsplash.com/photo-1531482615713-2afd69097998",
    registrationLink: "https://forms.google.com",
  },
  {
    id: "2",
    title: "Robo Wars",
    description: "Robotics battle competition.",
    posterUrl: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30",
    registrationLink: "https://forms.google.com",
  },
];

const EventDetails = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();

  // find event
  const event = mockEvents.find((e) => e.id === eventId);

  // If event not found
  if (!event) {
    return (
      <div className="p-10">
        <h2 className="text-xl font-semibold">Event not found</h2>
        <button
          onClick={() => navigate(-1)}
          className="mt-4 text-blue-500 underline"
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="p-10 max-w-4xl mx-auto">
      <button
        onClick={() => navigate(-1)}
        className="mb-6 text-blue-500 underline"
      >
        ← Back
      </button>

      <img
        src={event.posterUrl}
        alt={event.title}
        className="w-full rounded-xl mb-6"
      />

      <h1 className="text-3xl font-bold mb-4">{event.title}</h1>

      <p className="mb-6">{event.description}</p>

      <a
        href={event.registrationLink}
        target="_blank"
        rel="noopener noreferrer"
        className="bg-orange-500 text-white px-6 py-3 rounded-lg inline-block"
      >
        Register Now
      </a>
    </div>
  );
};

export default EventDetails;