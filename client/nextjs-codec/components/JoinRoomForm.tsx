import { useForm } from 'react-hook-form';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Enroll } from '@/utilities/apiService';
import { toast } from './ui/use-toast';
import { useQueryClient } from '@tanstack/react-query';

type JoinSchema = {
  slug: string;
};

export default function JoinRoomForm() {
  const queryClient = useQueryClient();

  const { register, handleSubmit } = useForm<JoinSchema>();

  async function onSubmit(data: any) {
    try {
      const res: any = await Enroll(data.slug);

      switch (res.message) {
        case 'Error occured': {
          toast({ title: 'Invalid room id, or room already joined' });
          break;
        }
        case 'Successfully joined': {
          toast({ title: 'Room joined!' });
          queryClient.refetchQueries({ queryKey: ['rooms', 1] });
          break;
        }
        default: {
          toast({ title: 'Something went wrong' });
          break;
        }
      }
    } catch (e) {
      throw new Error('Failed to enroll user');
    }
  }

  return (
    <>
      <form className="flex gap-2" onSubmit={handleSubmit(onSubmit)}>
        <Input placeholder="room-slug" {...register('slug')} />
        <Button type="submit" variant={'default'}>
          Join
        </Button>
      </form>
    </>
  );
}
