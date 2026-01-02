"use client";

import { DataTable } from "@/components/data-table";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { useAddModDrawer } from "@/lib/ui-states/add-moderator-drawer";
import { PenSquare, Plus, UserPlus } from "lucide-react";
import { columns, Moderator } from "./columns";
import { EditForm } from "./edit-form";
import { useQuery } from "@tanstack/react-query";
import { orpc } from "@/lib/orpc";

export const AddModMainSection = () => {
  const { mod_data, isEditOpen, isAddOpen, closeDrawer, openAddDrawer } =
    useAddModDrawer();
  const moderator = mod_data;

  const modListQuery = useQuery(
    orpc.admin.crudModerator.getModList.queryOptions()
  );
  const all_mod_list: Moderator[] = Array.isArray(modListQuery.data)
    ? modListQuery.data
    : [];

  const working_mod_list = all_mod_list.filter((mod) => mod.isWorking);
  const removed_mod_list = all_mod_list.filter((mod) => !mod.isWorking);
  const isLoading = modListQuery.isLoading;

  return (
    <div className="p-4 w-full max-w-7xl space-y-20">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl md:text-3xl font-bold text-primary">
          Working Moderators
        </h1>
        <Button variant={"default"} onClick={() => openAddDrawer()}>
          <Plus />
          Add Moderator
        </Button>
      </div>

      <div>
        <DataTable
          columns={columns}
          data={working_mod_list}
          isLoading={isLoading}
          sort="name"
        />
      </div>

      <div className="flex items-center justify-start mb-4">
        <h1 className="text-xl md:text-3xl font-bold text-destructive">
          Removed Moderators
        </h1>
      </div>

      <div>
        <DataTable
          columns={columns}
          data={removed_mod_list}
          isLoading={isLoading}
          sort="name"
        />
      </div>

      <div>
        {/* EDIT DRAWER */}
        <Drawer open={isEditOpen} onOpenChange={closeDrawer}>
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle className="flex items-center justify-center gap-2">
                <PenSquare />
                Edit Moderator
              </DrawerTitle>
            </DrawerHeader>
            <div className="px-10 pb-10">
              <EditForm mod_data={moderator} />
            </div>
          </DrawerContent>
        </Drawer>

        {/* CREATE DRAWER */}
        <Drawer open={isAddOpen} onOpenChange={closeDrawer}>
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle className="flex items-center justify-center gap-2">
                <UserPlus />
                Add Moderator
              </DrawerTitle>
            </DrawerHeader>
            <div className="px-10 pb-10">
              <EditForm mod_data={null} />
            </div>
          </DrawerContent>
        </Drawer>
      </div>
    </div>
  );
};
