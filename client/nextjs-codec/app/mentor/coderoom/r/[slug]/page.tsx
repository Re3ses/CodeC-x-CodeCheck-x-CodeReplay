'use client';

import { RoomSchemaInferredType } from '@/lib/interface/room';
import { GetRoom } from '@/utilities/apiService';
import { useQuery } from '@tanstack/react-query';
import RoomBanner from '@/components/RoomBanner';
import RoomEnroleeList from '@/components/RoomEnroleeList';
import RoomProblemList from '@/components/RoomProblemList';
import { getUser } from '@/lib/auth';

export default function Page({ params }: { params: { slug: string } }) {
  const userQuery = useQuery<any>({
    queryKey: ['user'],
    queryFn: async () => {
      const res = await getUser();
      return res;
    },
  });
  const roomQuery = useQuery<RoomSchemaInferredType>({
    queryKey: ['room'],
    queryFn: async () => {
      const res = await GetRoom(params.slug!);
      return res;
    },
  });

  if (!roomQuery.data) return <>Room not found.</>;
  return (
    <div className="p-2 flex flex-col h-screen gap-4">
      <RoomBanner
        room={roomQuery.data}
        username={userQuery.data.auth?.username}
        usertype={userQuery.data?.type}
        params={params}
      />
      <div className="flex gap-4">
        <RoomEnroleeList params={params} />
        <RoomProblemList params={params} />
      </div>
    </div>
  );
}
