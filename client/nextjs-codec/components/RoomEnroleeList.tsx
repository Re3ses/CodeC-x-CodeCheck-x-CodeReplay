import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { RoomSchemaInferredType } from '@/lib/interface/room';
import { GetRoom } from '@/utilities/apiService';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Search, Users } from 'lucide-react';

export default function RoomEnroleeList({
  params,
}: {
  params: { slug: string };
}) {
  const roomQuery = useQuery<RoomSchemaInferredType>({
    queryKey: ['room'],
    queryFn: async () => {
      const res = await GetRoom(params.slug!);
      return res;
    },
  });

  return (
    <Card className="w-[320px] hidden sm:block">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-muted-foreground" />
            <CardTitle className="text-lg font-semibold">Students</CardTitle>
          </div>
          <div className="text-sm text-muted-foreground">
            {roomQuery.data?.enrollees.length || 0} enrolled
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-2 mb-4">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search students..." 
            className="h-8"
          />
        </div>
        <div className="h-[400px] overflow-y-auto pr-4">
          <div className="space-y-4">
            {roomQuery.data?.enrollees.map((enrollee) => (
              <div
                key={enrollee._id}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-secondary transition-colors"
              >
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-primary/10 text-primary">
                    {`${enrollee.learner.first_name[0]}${enrollee.learner.last_name[0]}`}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                  <span className="text-sm font-medium">
                    {enrollee.learner.first_name} {enrollee.learner.last_name}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    Student
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}