"use client";

import { useEffect, useState } from "react";
import { Add, Person, Search } from "@mui/icons-material";
import { useRouter } from "next/navigation";
import { UserButton, useUser } from "@clerk/nextjs";
import Link from "next/link";
import { dark } from "@clerk/themes";
import Loader from "@components/Loader";

const TopBar = () => {
  const { user, isLoaded } = useUser();
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState(null);
  const router = useRouter();
  const [search, setSearch] = useState("");

  const getUser = async () => {
    if (user?.id) {
      const response = await fetch(`/api/user/${user.id}`);
      const data = await response.json();
      setUserData(data);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      getUser();
    }
  }, [user]);

  if (!isLoaded || loading) {
    return <Loader />;
  }

  return (
    <div className="flex justify-between items-center mt-6">
      <div className="relative">
        <input
          type="text"
          className="search-bar"
          placeholder="Search posts, people, ..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <Search
          className="search-icon"
          onClick={() => router.push(`/search/posts/${search}`)}
        />
      </div>

      <button
        className="create-post-btn"
        onClick={() => router.push("/create-post")}
      >
        <Add /> <p>Create A Post</p>
      </button>

      <div className="flex gap-4 md:hidden">
        {userData ? (
          <Link href={`/profile/${userData._id}/posts`}>
            <Person sx={{ fontSize: "35px", color: "white" }} />
          </Link>
        ) : (
          <p>Loading user data...</p>
        )}
        <UserButton appearance={{ baseTheme: dark }} afterSignOutUrl="/sign-in" />
      </div>
    </div> 
  );
};

export default TopBar;
