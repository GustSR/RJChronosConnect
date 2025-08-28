import { useQuery } from "@tanstack/react-query";
 import type { User as UserType } from "@shared/schema";

 // Narrow unknown data coming from React Query into our UserType shape
 function isUser(value: unknown): value is UserType {
   if (!value || typeof value !== "object") return false;
   const u = value as Record<string, unknown>;
   return (
     typeof u["id"] === "string" &&
     (u["email"] === null || typeof u["email"] === "string") &&
     (u["firstName"] === null || typeof u["firstName"] === "string") &&
     (u["lastName"] === null || typeof u["lastName"] === "string")
   );
 }

 export function useAuth() {
   const { data, isLoading } = useQuery({
     queryKey: ["/api/auth/user"],
     retry: false,
   });

   const user: UserType | null = isUser(data) ? (data as UserType) : null;

   return {
     user,
     isLoading,
     isAuthenticated: !!user,
   };
 }