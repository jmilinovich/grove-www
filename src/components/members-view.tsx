"use client";

import { useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import MemberTable from "./member-table";
import MemberDrawer from "./member-drawer";

interface UserMeta {
  id: string;
  username: string | null;
  email: string | null;
  role: string;
  created_at: string;
  last_login_at: string | null;
  key_count: number;
  trails: string[];
}

interface Trail {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
}

export default function MembersView({
  initialUsers,
  trails,
}: {
  initialUsers: UserMeta[];
  trails: Trail[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const memberId = searchParams.get("member");

  const openMember = useCallback(
    (userId: string) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("member", userId);
      router.replace(`?${params.toString()}`);
    },
    [router, searchParams],
  );

  return (
    <>
      <MemberTable initialUsers={initialUsers} trails={trails} onRowClick={openMember} />
      {memberId && <MemberDrawer memberId={memberId} />}
    </>
  );
}
