import React from "react";
import ItemPanel from "./ItemPanel";
import MediaCard from "./MediaCard";

async function fetchFavorites (bounds, user_id) {
  const minLat = bounds.south;
  const maxLat = bounds.north;
  const minLon = bounds.west;
  const maxLon = bounds.east;

  try {
    const res = await axios.post(
      "https://fetchitems-jbhycjd2za-uc.a.run.app",
      {
        minLat: minLat,
        maxLat: maxLat,
        minLon: minLon,
        maxLon: maxLon,
        user_id: user_id
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    return res.data;
  } catch (error) {
    console.error(error);
  }
}

export default function Favorites({mapBounds, setMapBounds, visibleItems, setVisibleItems}) {
  const [userId, setUserId] = React.useState("");
  const handleFavorites = async (e) => {
    e.preventDefault();
    const items = await fetchFavorites(mapBounds, user_id);
    if (items) {
       setVisibleItems(items);
    }

  };
  
  return (
    <div>
      <h1>favorites</h1>
      <MediaCard></MediaCard>
    </div>
  );
}
