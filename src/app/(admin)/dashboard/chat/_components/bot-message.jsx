import PropertyCard from "@/components/ui/property-card";

export default function BotMessageCard({ message }) {
  const { properties, bot_response, timestamp } = message;
  console.log(message)
  console.log(properties)
  const propertiesItems = properties ? Object.values(properties) : [];

  return (
    <div className=" w-fit rounded-lg p-2 bg-white flex flex-col ">
      <div className="text-sm ">{bot_response||message}</div>

      {propertiesItems?.length > 0 &&
        propertiesItems.map((itm, idx) => (
          <PropertyCard key={idx} data={itm} message={message} />
        ))}
    </div>
  );
}
