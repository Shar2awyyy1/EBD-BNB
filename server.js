import express from "express";

const app = express();


// ==================================================
// MIDDLEWARE
// ==================================================

// Log every request
app.use((req, res, next) => {
  console.log(req.method, req.url);
  next();
});

// Read JSON request bodies
app.use(express.json());


// ==================================================
// DATABASE
// ==================================================

let listings = [
  {
    id: 1,
    title: "Nile View Apartment",
    pricePerNight: 85
  },
  {
    id: 2,
    title: "Beach House",
    pricePerNight: 140
  },
  {
    id: 3,
    title: "Desert Eco-Lodge",
    pricePerNight: 60
  }
];

let nextId = 4;


// ==================================================
// MODEL
// ==================================================

function getAllListings() {
  return listings;
}

function getListingById(id) {
  return listings.find((listing) => listing.id === id);
}

function addListing(data) {
  const listing = {
    id: nextId++,
    title: data.title,
    pricePerNight: data.pricePerNight
  };

  listings.push(listing);

  return listing;
}

function updateListing(id, data) {
  const listing = getListingById(id);

  if (listing) {
    listing.title = data.title;
    listing.pricePerNight = data.pricePerNight;
  }

  return listing;
}

function removeListing(id) {
  const listing = getListingById(id);

  listings = listings.filter((item) => item.id !== id);

  return listing;
}


// ==================================================
// CONTROLLERS
// ==================================================

function handleGetAll(req, res) {
  res.json(getAllListings());
}

function handleGetOne(req, res) {
  const id = Number(req.params.id);

  const listing = getListingById(id);

  if (!listing) {
    return res.status(404).json({
      error: "Listing not found"
    });
  }

  res.json(listing);
}

function handleCreate(req, res) {
  const data = req.body || {};

  if (!data.title || !data.pricePerNight) {
    return res.status(400).json({
      error: "title and pricePerNight are required"
    });
  }

  const listing = addListing(data);

  res.status(201).json(listing);
}

function handleUpdate(req, res) {
  const data = req.body || {};

  if (!data.title || !data.pricePerNight) {
    return res.status(400).json({
      error: "title and pricePerNight are required"
    });
  }

  const id = Number(req.params.id);

  const listing = updateListing(id, data);

  if (!listing) {
    return res.status(404).json({
      error: "Listing not found"
    });
  }

  res.json(listing);
}

function handleDelete(req, res) {
  const id = Number(req.params.id);

  const listing = removeListing(id);

  if (!listing) {
    return res.status(404).json({
      error: "Listing not found"
    });
  }

  res.status(204).end();
}


// ==================================================
// ROUTES
// ==================================================

app.get("/", (req, res) => {
  res.send("Welcome to ebd bn'b");
});

app.get("/api/listings", handleGetAll);

app.get("/api/listings/:id", handleGetOne);

app.post("/api/listings", handleCreate);

app.put("/api/listings/:id", handleUpdate);

app.delete("/api/listings/:id", handleDelete);


// ==================================================
// START SERVER
// ==================================================

app.listen(3000, () => {
  console.log("Server running at http://localhost:3000");
});