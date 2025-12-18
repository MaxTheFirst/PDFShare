import { useEffect, useState } from "react";
import { useParams, useLocation } from "wouter";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchFolders, fetchFolderById } from "@/store/slices/foldersSlice";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { FileExplorer } from "@/components/file-explorer";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { logout } from "@/store/slices/authSlice";
import { verifyAuth } from "@/store/slices/authSlice";

export default function Explorer() {
  const { folderId } = useParams<{ folderId?: string }>();
  const [_, setLocation] = useLocation();
  const dispatch = useAppDispatch();
  const { user, loading: authLoading } = useAppSelector(state => state.auth);
  const { folders, currentFolder, loading } = useAppSelector(state => state.folders);

  useEffect(() => {
      dispatch(verifyAuth());
    }, [dispatch]);

  useEffect(() => {
    if (user) {
      dispatch(fetchFolders());
    }
  }, [dispatch, user, authLoading, setLocation]);

  useEffect(() => {
    if (folderId) {
      dispatch(fetchFolderById(folderId));
    }
  }, [folderId, dispatch]);

  const handleLogout = async () => {
    await dispatch(logout());
    setLocation('/');
  };

  const sidebarStyle = {
    "--sidebar-width": "20rem",
    "--sidebar-width-icon": "4rem",
  };

  if (authLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="text-muted-foreground">Загрузка...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <SidebarProvider style={sidebarStyle as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <AppSidebar folders={folders} />
        <div className="flex flex-col flex-1">
          <header className="flex items-center justify-between gap-4 p-4 border-b">
            <div className="flex items-center gap-2">
              <SidebarTrigger data-testid="button-sidebar-toggle" />
              <h1 className="text-xl font-semibold">
                {currentFolder ? currentFolder.name : 'Проводник'}
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                {user.username}
              </span>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleLogout}
                data-testid="button-logout"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </header>
          <main className="flex-1 overflow-hidden">
            <FileExplorer 
              folderId={folderId} 
              folder={currentFolder}
              loading={loading}
            />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
