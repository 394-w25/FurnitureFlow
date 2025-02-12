import React, { useEffect, useState } from "react";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import { useAuth } from "../services/auth";
import { FaSignOutAlt } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { auth } from "../firebase/FirebaseConfig";
import Navigation from "../components/Navigation";
import axios from "axios";
import { Carousel } from "primereact/carousel";
import MediaCard from "../components/MediaCard";
import {Box, IconButton, Typography, Snackbar, Alert, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Button, Backdrop} from "@mui/material";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import { writeBatch, collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../firebase/FirebaseConfig";
import LoadingScreen from "../components/Loading";

export default function Profile() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [userPosts, setUserPosts] = useState([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [postToDelete, setPostToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [autoPlayInterval, setAutoPlayInterval] = useState(3000);

  useEffect(() => {
    if (user) {
      setLoadingPosts(true);
      axios
        .post("https://getuserposts-jbhycjd2za-uc.a.run.app", { user_id: user.uid })
        .then((response) => setUserPosts(response.data))
        .catch((error) => console.error("Error fetching user posts:", error))
        .finally(() => setLoadingPosts(false));
    }
  }, [user]);

  const handleLogout = async () => {
    try {
      await auth.signOut();
      navigate("/login");
    } catch (error) {
      console.error("Error signing out:", error);
      alert("Failed to sign out. Please try again.");
    }
  };

  const confirmDeletePost = (item_id) => {
    setPostToDelete(item_id);
    setDialogOpen(true);
  };

  const handleConfirmedDelete = async () => {
    if (!postToDelete) return;
    setIsDeleting(true);

    try {
      // Fetch all inbox_items related to this post from Firestore
      const inboxCollection = collection(db, "inbox_items");
      const inboxQuery = query(inboxCollection, where("item_id", "==", postToDelete));
      const inboxDocs = await getDocs(inboxQuery);

      // Collect inbox_item_ids
      const inboxItemIds = inboxDocs.docs.map((doc) => doc.id);

      if (inboxItemIds.length > 0) {
        // Delete all messages linked to each inbox_item_id
        for (const inboxItemId of inboxItemIds) {
          const messagesQuery = query(
            collection(db, "messages"),
            where("inbox_item_id", "==", inboxItemId)
          );
          const messagesDocs = await getDocs(messagesQuery);

          const messageBatch = writeBatch(db);
          messagesDocs.forEach((doc) => messageBatch.delete(doc.ref));
          await messageBatch.commit();
        }

        // Delete the inbox_items after deleting their messages
        const inboxBatch = writeBatch(db);
        inboxDocs.forEach((doc) => inboxBatch.delete(doc.ref));
        await inboxBatch.commit();
      }

      // Call backend to delete records
      await axios.post("https://deleteuserpost-jbhycjd2za-uc.a.run.app", {
        user_id: user.uid,
        item_id: postToDelete,
      });

      // Update UI to remove deleted post
      setUserPosts((prevPosts) =>
        prevPosts.filter((post) => post.item_id !== postToDelete)
      );
      setSnackbarMessage("Post deleted successfully!");
      setSnackbarOpen(true);
    } catch (error) {
      console.error("Error deleting post:", error);
      setSnackbarMessage("Failed to delete post. Please try again.");
      setSnackbarOpen(true);
    } finally {
      setIsDeleting(false);
      setDialogOpen(false);
      setPostToDelete(null);
    }
  };

  const handleCloseSnackbar = () => setSnackbarOpen(false);

  const responsiveOptions = [
    { breakpoint: "1024px", numVisible: 1, numScroll: 1 },
    { breakpoint: "600px", numVisible: 1, numScroll: 1 },
  ];

  const customNext = ({ onClick }) => (
    <IconButton
      onClick={() => {
        setAutoPlayInterval(500);
        onClick();
      }}
    >
      <ArrowForwardIosIcon fontSize="large" />
    </IconButton>
  );

  const customPrev = ({ onClick }) => (
    <IconButton
      onClick={() => {
        setAutoPlayInterval(500);
        onClick();
      }}
    >
      <ArrowBackIosNewIcon fontSize="large" />
    </IconButton>
  );

  return (
    <>
      <div className="flex flex-col justify-center items-center pb-8 bg-[radial-gradient(ellipse at 50% 50%, hsl(210, 100%, 97%), hsl(0, 0%, 100%))]">
        <Navigation showSearchBar={false} />
        <div className="bg-amber-200 h-70 w-full">
          <img
              className="h-72 w-full object-fill"
              src="/images/deering.png"
          />
        </div>

        <div
            className="flex flex-col items-center border border-[#b4a3c4] border-[5px] h-[auto] w-3/4 max-w-[500px] mt-[-125px] mb-10 pb-7 rounded-[20px] bg-gradient-to-b from-stone-100 to-purple-100"
            style={{
              boxShadow:
                  'hsla(220, 30%, 5%, 0.05) 0px 5px 15px 0px, hsla(220, 25%, 10%, 0.05) 0px 15px 35px -5px',
            }}
        >
          <div className="mt-[30px] flex items-center pb-[10px]">
            {user.photoURL ? (
              <img src={user.photoURL} className="rounded-full size-[63px]" alt="Profile" />
            ) : (
              <AccountCircleIcon fontSize="large" className="text-[70px]" />
            )}
          </div>
          <h1 className="text-center text-[20px]">{user.displayName || "User"}</h1>
          <h1 className="text-center text-[auto] mt-[10px]">{user.email || "Email"}</h1>

          <div className="mt-5">
            {user && (
              <button
                onClick={handleLogout}
                className="flex items-center text-black hover:text-red-500 cursor-pointer bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-4 rounded-lg flex items-center justify-center gap-2 w-full"
                aria-label="Logout"
                title="Logout"
              >
                <FaSignOutAlt className="text-[25px] text-xl mr-1" />
                <h5 className="mt-[-7px] text-[25px] ml-1">LOG OUT</h5>
              </button>
            )}
          </div>
        </div>

        <Backdrop open={isDeleting} style={{ zIndex: 1300, color: "#fff" }}>
          <LoadingScreen />
        </Backdrop>
            
        {loadingPosts ? (
          <Box className="flex justify-center items-center mt-5">
            <LoadingScreen text={"Loading Posts..."} />
          </Box>
        ) : (
          <Box
            className="w-full max-w-3xl mt-5"
            onMouseEnter={() => setAutoPlayInterval(0)}
            onMouseLeave={() => setAutoPlayInterval(3000)}
          >
            <Typography variant="h6" className="text-center mb-3">
              Your Posts
            </Typography>
            {userPosts.length > 0 ? (
              userPosts.length > 1 ? (
                <Carousel
                  value={userPosts}
                  numVisible={1}
                  numScroll={1}
                  responsiveOptions={responsiveOptions}
                  circular
                  autoplayInterval={autoPlayInterval}
                  itemTemplate={(post) => (
                    <Box className="flex justify-center">
                      <MediaCard
                        item={post}
                        size={100}
                        onDelete={() => confirmDeletePost(post.item_id)}
                        allowStatusChange={true}
                      />
                    </Box>
                  )}
                  nextIcon={customNext}
                  prevIcon={customPrev}
                  showIndicators
                />
              ) : (
                <Box className="flex justify-center">
                  <MediaCard
                    item={userPosts[0]}
                    size={100}
                    onDelete={() => confirmDeletePost(userPosts[0].item_id)}
                    allowStatusChange={true}
                    onProfile = {true}
                  />
                </Box>
              )
            ) : (
              <Typography className="text-center text-gray-600">No posts yet.</Typography>
            )}
          </Box>
        )}
      </div>
      <div className="bg-purple-600 h-5 w-full fixed-bottom">

      </div>

      <Snackbar open={snackbarOpen} autoHideDuration={3000} onClose={handleCloseSnackbar}>
        <Alert onClose={handleCloseSnackbar} severity="success">
          {snackbarMessage}
        </Alert>
      </Snackbar>

      {/* Confirmation Dialog for Deleting Posts */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)}>
        <DialogTitle>Confirm Deletion</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this post? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)} color="primary">
            Cancel
          </Button>
          <Button onClick={handleConfirmedDelete} color="error">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}