import React, { useState, useEffect } from "react";
import { Container } from "react-bootstrap";
import useUserProfile from "../hooks/useUserProfile";
import { Link } from "react-router-dom";
import "../styles/UserProfile.css";


const UserProfile = () => {
  const { profileData, loading, isAuthenticated } = useUserProfile();
  const [profilePic, setProfilePic] = useState("");
  const [bannerPic, setBannerPic] = useState("");
  const [editableName, setEditableName] = useState("");
  const [editableUsername, setEditableUsername] = useState("");
  const [bio, setBio] = useState("");
  const [contact, setContact] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [photoGallery, setPhotoGallery] = useState([]);

  useEffect(() => {
    if (profileData) {
      const savedBanner = localStorage.getItem("bannerPic");
      const savedProfile = localStorage.getItem("profilePic");
      const savedBio = localStorage.getItem("bio");
      const savedContact = localStorage.getItem("contact");
      const savedName = localStorage.getItem("name");
      const savedUsername = localStorage.getItem("username");

      setBannerPic(savedBanner || profileData.bannerPic);
      setProfilePic(savedProfile || profileData.profilePic);
      setBio(savedBio || profileData.bio);
      setContact(savedContact || profileData.contact);
      setEditableName(savedName || profileData.name);
      setEditableUsername(savedUsername || profileData.username);
    }
  }, [profileData]);

  const handleBannerPicChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      const formData = new FormData();
      formData.append("image", file);
  
      try {
        const res = await fetch(`${process.env.REACT_APP_API_URL}/api/upload`, {
          method: "POST",
          body: formData,
        });
  
        const data = await res.json();
        const uploadedImageUrl = data.imageUrl;
  
        setBannerPic(uploadedImageUrl);
  
        // Now update the user's backgroundImage in MongoDB
        await fetch(`${process.env.REACT_APP_API_URL}/api/users/updateProfile`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            auth0Id: profileData.auth0Id,
            backgroundImage: uploadedImageUrl,
          }),
        });
  
      } catch (error) {
        console.error("Banner upload failed:", error);
      }
    }
  };
  

  const handleSave = () => {
    localStorage.setItem("bio", bio);
    localStorage.setItem("contact", contact);
    localStorage.setItem("name", editableName);
    localStorage.setItem("username", editableUsername);
    setIsEditing(false);
  };

  if (!isAuthenticated || !profileData) {
    return <p className="auth-warning">Please log in to view your profile.</p>;
  }

  if (loading) return <p>Loading profile...</p>;

  return (
    <>
      <Container fluid className="p-0 m-0">
        <div
          className="profile-banner"
          style={{ backgroundImage: `url(${bannerPic})` }}
        >
          <label className="upload-banner-label">
            📸 Change background
            <input
              type="file"
              accept="image/*"
              onChange={handleBannerPicChange}
              hidden
            />
          </label>
          <div className="profile-avatar-wrapper">
            <img
              className="profile-avatar"
              src={profilePic}
              alt={`Avatar of ${editableName}`}
            />
          </div>
        </div>
      </Container>

      <Container className="profile-wrapper">
        <div className="profile-card">
          {isEditing ? (
            <>
              <input
                type="text"
                value={editableName}
                onChange={(e) => setEditableName(e.target.value)}
                className="form-control my-2"
                placeholder="Your full name"
              />
              <input
                type="text"
                value={editableUsername}
                onChange={(e) => setEditableUsername(e.target.value)}
                className="form-control my-2"
                placeholder="Your username"
              />
            </>
          ) : (
            <>
              <h2>{editableName}</h2>
              <p className="profile-username">@{editableUsername}</p>
            </>
          )}
          {isEditing ? (
            <>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={3}
                className="form-control my-2"
                placeholder="Enter your bio"
              />
              <input
                type="email"
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                className="form-control my-2"
                placeholder="Contact email"
              />
              <button onClick={handleSave} className="modal-button my-2">
                💾 Save
              </button>
            </>
          ) : (
            <>
              <p>{bio}</p>
              <a href={`mailto:${contact}`}>
                <span role="img" aria-label="mail">
                  📧
                </span>{" "}
                {contact}
              </a>
              <br />
              <button
                onClick={() => setIsEditing(true)}
                className="modal-button my-2"
              >
                ✏️ Edit Profile Biography
              </button>
            </>
          )}
        </div>
        <div className="profile-card">
          <h3>Manage My Events</h3>
          <p>View and edit the events you’re hosting or attending.</p>
          <Link to="/manage-events" className="modal-button">
            Go to Event Manager
          </Link>
        </div>
      </Container>


      <Container className="photo-gallery mt-2">
        <h3 className="mb-3">
          My Photo Gallery
          <label className="modal-button circular-upload-button">
            <span className="white-plus">+</span>
            <input
              type="file"
              accept="image/*"
              hidden
              onChange={(e) => {
                const file = e.target.files[0];
                if (file) {
                  const reader = new FileReader();
                  reader.onloadend = () => {
                    if (reader.result) {
                      setPhotoGallery((prev) => [...prev, reader.result]);
                    }
                  };
                  reader.readAsDataURL(file);
                }
              }}
            />
          </label>
        </h3>
        <div className="photo-grid">
          {photoGallery.map((photo, index) => (
            <div key={index} className="photo-grid-item">
              <img src={photo} alt={`Uploaded ${index}`} />
            </div>
          ))}
        </div>
      </Container>
    </>
  );
};

export default UserProfile;
