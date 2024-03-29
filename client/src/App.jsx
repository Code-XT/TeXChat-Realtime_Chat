import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import EmojiPicker from "emoji-picker-react";

function App({ socket }) {
  const [message, setMessage] = useState("");
  let [messages, setMessages] = useState([]);
  const [status, setStatus] = useState("");
  let [members, setMembers] = useState([]);
  let typingTimeout;
  const { username } = useParams();
  const navigate = useNavigate();
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  useEffect(() => {
    socket.on("connect", () => {
      setStatus("online");

      socket.emit("join", socket.id, username);
    });
    socket.on("disconnect", () => {
      setStatus("offline");
    });
    return () => {
      socket.close();
      socket.off("connect");
      socket.off("disconnect");
    };
  }, [socket]);

  const sendMessage = (e) => {
    e.preventDefault();
    socket.emit("message", username, e.target[0].value, message);
    // e.target[0].value
    //   ? (document.getElementById(
    //       "messages"
    //     ).innerHTML += `<p>Me (${e.target[0].value}): ${message}</p>`)
    //   : (document.getElementById(
    //       "messages"
    //     ).innerHTML += `<p>Me: ${message}</p>`);
    setMessage("");
  };

  socket.on("response", (message) => {
    setMessages((messages = [...messages, message]));
  });

  socket.on("joined", (member) => {
    setMembers((members = [...member]));
  });

  socket.on("typing_status", (isTyping, memberId) => {
    const typingSpan = document.getElementById(`typing_${memberId}`);
    if (typingSpan) {
      typingSpan.innerHTML = isTyping ? " is typing" : "";
    }
  });

  const handleLogout = () => {
    socket.close();
    navigate("/");
    const newUsers = members.filter((user) => user.receiver !== username);
    setMembers(newUsers);
  };

  const handleEmojiClick = (chosenEmoji) => {
    console.log(chosenEmoji);
    setMessage(message + chosenEmoji.emoji);
    setShowEmojiPicker(false); // Hide emoji picker after selection
  };

  return (
    <>
      <div className="min-h-screen flex justify-center items-center bg-gradient-to-r from-blue-500 to-green-400">
        <div className="bg-white bg-opacity-25 p-8 rounded-lg shadow-lg flex flex-wrap">
          <div className="flex flex-col mr-4">
            <div className="min-h-screen flex justify-items-start place-items-start">
              <div className="bg-white bg-opacity-25 p-8 rounded-lg shadow-lg h-full">
                <h4 className="text-lg font-bold mb-2 text-white">Members</h4>
                {members.map((mb) => (
                  <p key={mb.id} className=" mb-2 text-white">
                    {status === "online" ? "Online" : "Offline"}: {mb.receiver}
                    <span id={`typing_${mb.id}`} className="ml-2"></span>
                  </p>
                ))}
              </div>
            </div>
          </div>
          <div className="min-h-screen flex justify-items-start place-items-start">
            <div className="bg-white bg-opacity-25 p-8 rounded-lg shadow-lg">
              <div className="flex flex-col flex-grow">
                <h3 className="text-2xl text-center font-bold mb-4 text-white">
                  TeXChat
                </h3>
                <h3 className="text-lg text-center text-gray-600 mb-4">
                  Welcome {username}
                </h3>

                <div className="flex justify-center">
                  <button
                    onClick={handleLogout}
                    className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition duration-300 mb-4"
                  >
                    Logout
                  </button>
                </div>

                <form
                  onSubmit={(e) => sendMessage(e)}
                  className="flex items-center mb-4 "
                >
                  <input
                    type="text"
                    placeholder="Receiver"
                    className="flex-grow p-2 mr-2 border rounded-lg focus:outline-none bg-opacity-50"
                  />
                  <input
                    type="text"
                    placeholder="Message"
                    value={message}
                    onChange={(e) => {
                      setMessage(e.target.value);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        socket.emit("typing", {
                          isTyping: false,
                          memberId: socket.id,
                        });
                      } else {
                        socket.emit("typing", {
                          isTyping: true,
                          memberId: socket.id,
                        });
                        clearTimeout(typingTimeout);
                        typingTimeout = setTimeout(() => {
                          socket.emit("typing", {
                            isTyping: false,
                            memberId: socket.id,
                          });
                        }, 1000);
                      }
                    }}
                    className="flex-grow p-2 border rounded-lg focus:outline-none bg-opacity-50"
                  />

                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition duration-300 ml-2"
                  >
                    Send
                  </button>
                </form>
                <button
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  className="ml-2"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="w-6 h-6"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15.182 15.182a4.5 4.5 0 01-6.364 0M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </button>
                {showEmojiPicker && (
                  <EmojiPicker onEmojiClick={handleEmojiClick} theme="auto" />
                )}
              </div>
            </div>
          </div>
          <div className="flex flex-row flex-1 ml-2">
            <div className="min-h-screen flex justify-items-start place-items-start">
              <div className="bg-white bg-opacity-25 p-8 rounded-lg shadow-lg h-full">
                <h2 className="text-xl font-bold mt-6 mb-4 text-white">
                  Messages
                </h2>
                <div
                  id="messages"
                  className="max-h-80 overflow-y-auto"
                  style={{ maxHeight: "400px" }}
                >
                  {messages.map((m, index) => (
                    <p key={index} className="my-2 text-white">
                      {m.receiver
                        ? (m.username === username ? m.receiver : m.username) +
                          " (Private): " +
                          m.message
                        : (m.username === username ? "Me" : m.username) +
                          ": " +
                          m.message}
                    </p>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default App;
