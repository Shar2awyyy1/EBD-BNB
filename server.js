
import express from "express";
import mongoose from "mongoose";

const app = express();
const PORT = 3000;

// ========== MIDDLEWARE ==========

app.use((req, res, next) => {
  console.log(req.method, req.url);
  next();
});

app.use(express.json());

// ========== DATABASE ==========

async function connectDB() {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new Error("MONGODB_URI is missing from .env");
  }

  await mongoose.connect(uri);
  console.log("Connected to MongoDB Atlas");

  // Add sample listings only if the collection is empty.
  const count = await Listing.countDocuments();

  if (count === 0) {
    await Listing.insertMany([
      { id: 1, title: "Nile View Apartment", pricePerNight: 85 },
      { id: 2, title: "Beach House", pricePerNight: 140 },
      { id: 3, title: "Desert Eco-Lodge", pricePerNight: 60 },
    ]);

    console.log("Sample listings inserted");
  }
}

// ========== MODEL ==========

const listingSchema = new mongoose.Schema({
  id: {
    type: Number,
    required: true,
    unique: true,
  },
  title: {
    type: String,
    required: true,
  },
  pricePerNight: {
    type: Number,
    required: true,
    min: 0,
  },
});

const Listing = mongoose.model("Listing", listingSchema);

async function getAllListings() {
  return Listing.find({}, { _id: 0, __v: 0 }).sort({ id: 1 });
}

async function getListingById(id) {
  return Listing.findOne({ id }, { _id: 0, __v: 0 });
}

async function addListing(data) {
  const lastListing = await Listing.findOne().sort({ id: -1 });
  const id = lastListing ? lastListing.id + 1 : 1;

  const listing = await Listing.create({
    id,
    title: data.title,
    pricePerNight: data.pricePerNight,
  });

  return {
    id: listing.id,
    title: listing.title,
    pricePerNight: listing.pricePerNight,
  };
}

async function updateListing(id, data) {
  return Listing.findOneAndUpdate(
    { id },
    {
      title: data.title,
      pricePerNight: data.pricePerNight,
    },
    { new: true, runValidators: true, projection: { _id: 0, __v: 0 } }
  );
}

async function removeListing(id) {
  return Listing.findOneAndDelete({ id });
}

// ========== CONTROLLERS ==========

function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

function validListingData(data) {
  return (
    typeof data?.title === "string" &&
    data.title.trim().length > 0 &&
    data.pricePerNight !== undefined &&
    data.pricePerNight !== null &&
    data.pricePerNight !== "" &&
    Number.isFinite(Number(data.pricePerNight)) &&
    Number(data.pricePerNight) >= 0
  );
}

const handleGetAll = asyncHandler(async (req, res) => {
  res.json(await getAllListings());
});

const handleGetOne = asyncHandler(async (req, res) => {
  const listing = await getListingById(Number(req.params.id));

  if (!listing) {
    return res.status(404).json({ error: "Listing not found" });
  }

  res.json(listing);
});

const handleCreate = asyncHandler(async (req, res) => {
  if (!validListingData(req.body)) {
    return res.status(400).json({
      error: "title and pricePerNight are required and must be valid",
    });
  }

  const listing = await addListing({
    title: req.body.title.trim(),
    pricePerNight: Number(req.body.pricePerNight),
  });

  res.status(201).json(listing);
});

const handleUpdate = asyncHandler(async (req, res) => {
  if (!validListingData(req.body)) {
    return res.status(400).json({
      error: "title and pricePerNight are required and must be valid",
    });
  }

  const listing = await updateListing(Number(req.params.id), {
    title: req.body.title.trim(),
    pricePerNight: Number(req.body.pricePerNight),
  });

  if (!listing) {
    return res.status(404).json({ error: "Listing not found" });
  }

  res.json(listing);
});

const handleDelete = asyncHandler(async (req, res) => {
  const listing = await removeListing(Number(req.params.id));

  if (!listing) {
    return res.status(404).json({ error: "Listing not found" });
  }

  res.status(204).end();
});

// ========== ROUTES ==========

app.get("/", (req, res) => {
  res.send("Welcome to ebd bn'b");
});

app.get("/api/listings", handleGetAll);
app.get("/api/listings/:id", handleGetOne);
app.post("/api/listings", handleCreate);
app.put("/api/listings/:id", handleUpdate);
app.delete("/api/listings/:id", handleDelete);

// ========== ERROR HANDLER ==========

app.use((err, req, res, next) => {
  console.error(err.message);
  res.status(500).json({ error: "Internal server error" });
});

// ========== START ==========

async function startServer() {
  try {
    await connectDB();

    app.listen(PORT, () => {
      console.log(`Server running at http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Server startup failed:", error.message);
    process.exit(1);
  }
}

startServer();
