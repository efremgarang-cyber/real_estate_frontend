import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, MapPin, Loader2 } from "lucide-react";
import { motion } from "motion/react";
import { propertyApi } from "../../../api/properties";
import { Property } from "../../../types";

export const PropertyDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeImage, setActiveImage] = useState<string>("");

  useEffect(() => {
    const fetchPropertyDetails = async () => {
      if (!id) return;
      try {
        setLoading(true);
        const response = await propertyApi.getById(Number(id));
        const data = response?.data || response;

        if (data) {
          setProperty(data as Property);

          const getImageUrl = (img: any) =>
            typeof img === "string" ? img : img?.url || "";

          const allImages = [
            ...(Array.isArray(data.images) ? data.images.map(getImageUrl) : []),
            ...(Array.isArray(data.interior_images) ? data.interior_images : []),
          ];

          if (allImages.length > 0) setActiveImage(allImages[0]);
        }
      } catch (err) {
        setError("Failed to load property details.");
      } finally {
        setLoading(false);
      }
    };

    fetchPropertyDetails();
  }, [id]);

  if (loading)
    return (
      <div className="p-10 text-center">
        <Loader2 className="animate-spin inline" />
      </div>
    );

  if (error || !property)
    return (
      <div className="p-10 text-center text-red-600">
        {error || "Property not found."}
      </div>
    );

  const priceValue = parseFloat(property.price);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-6xl mx-auto px-4 py-8 text-left"
    >
      <button
        onClick={() => navigate(-1)}
        className="mb-6 flex items-center gap-2 text-sm text-gray-500 hover:text-black"
      >
        <ArrowLeft size={18} /> Return Back
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-7 space-y-4">
          <div className="aspect-video bg-gray-100 rounded-3xl overflow-hidden">
            {activeImage && (
              <img
                src={activeImage}
                className="w-full h-full object-cover"
                alt={property.title}
              />
            )}
          </div>

          <div className="grid grid-cols-5 gap-2">
            {[
              ...(Array.isArray(property.images)
                ? property.images.map((i: any) =>
                    typeof i === "string" ? i : i.url
                  )
                : []),
              ...(property.interior_images || []),
            ].map((url, idx) => (
              <button
                key={idx}
                onClick={() => setActiveImage(url)}
                className="aspect-video rounded-lg overflow-hidden border-2 border-transparent hover:border-black"
              >
                <img
                  src={url}
                  className="w-full h-full object-cover"
                  alt="Gallery thumbnail"
                />
              </button>
            ))}
          </div>
        </div>

        <div className="lg:col-span-5 space-y-6">
          <h1 className="text-3xl font-black">{property.title}</h1>
          <p className="text-gray-500 flex items-center gap-1">
            <MapPin size={16} /> {property.location}
          </p>

          <div className="p-6 bg-gray-50 rounded-2xl">
            <span className="text-xs uppercase text-gray-400 font-bold">
              Price
            </span>
            <div className="text-2xl font-black">
              KES {priceValue.toLocaleString()}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-3 bg-white border rounded-xl font-bold">
              {property.bedrooms} Beds
            </div>
            <div className="text-center p-3 bg-white border rounded-xl font-bold">
              {property.baths} Baths
            </div>
            <div className="text-center p-3 bg-white border rounded-xl font-bold">
              {property.sqft} SQFT
            </div>
          </div>

          <p className="text-gray-600 leading-relaxed">
            {property.description}
          </p>
        </div>
      </div>
    </motion.div>
  );
};