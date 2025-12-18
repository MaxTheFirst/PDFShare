import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { Folder, Plus, Info } from "lucide-react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { CreateFolderDialog } from "./create-folder-dialog";
import type { Folder as FolderType } from "@shared/schema";

interface AppSidebarProps {
  folders: FolderType[];
}

export function AppSidebar({ folders }: AppSidebarProps) {
  const [location] = useLocation();
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  const userFolders = folders.filter(f => !f.isRecent);

  return (
    <>
      <Sidebar>
        <SidebarContent>
          <SidebarGroup>
            <div className="flex items-center justify-between px-2">
              <SidebarGroupLabel>Мои папки</SidebarGroupLabel>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => setShowCreateDialog(true)}
                data-testid="button-create-folder"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <SidebarGroupContent>
              <SidebarMenu>
                {userFolders.length === 0 ? (
                  <div className="px-2 py-4 text-sm text-muted-foreground text-center">
                    Нет папок
                  </div>
                ) : (
                  userFolders.map((folder) => (
                    <SidebarMenuItem key={folder.id}>
                      <SidebarMenuButton
                        asChild
                        isActive={location === `/explorer/${folder.id}`}
                        data-testid={`folder-${folder.id}`}
                      >
                        <Link href={`/explorer/${folder.id}`}>
                          <Folder className="h-4 w-4" />
                          <span>{folder.name}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))
                )}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild data-testid="link-about">
                <Link href="/about">
                  <Info className="h-4 w-4" />
                  <span>О проекте</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>

      <CreateFolderDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
      />
    </>
  );
}
