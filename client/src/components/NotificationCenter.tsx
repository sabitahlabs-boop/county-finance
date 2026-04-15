import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Popover, PopoverContent, PopoverTrigger
} from "@/components/ui/popover";
import { Bell, AlertTriangle, Clock, Calendar, HandCoins } from "lucide-react";
import { formatRupiah } from "../../../shared/finance";

export default function NotificationCenter() {
  const [open, setOpen] = useState(false);
  const { data: dueDates } = trpc.notifications.dueDates.useQuery(undefined, {
    refetchInterval: 60000, // refresh every minute
  });

  const totalNotifications = (dueDates?.debts?.length || 0);
  const hasOverdue = dueDates?.debts?.some(d => d.status === "terlambat");

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-9 w-9">
          <Bell className={`h-4 w-4 ${hasOverdue ? "text-red-500" : ""}`} />
          {totalNotifications > 0 && (
            <span className={`absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full text-[10px] font-bold flex items-center justify-center text-white ${hasOverdue ? "bg-red-500" : "bg-amber-500"}`}>
              {totalNotifications > 9 ? "9+" : totalNotifications}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="p-3 border-b">
          <h3 className="font-semibold text-sm flex items-center gap-2">
            <Bell className="h-4 w-4" /> Notifikasi
          </h3>
        </div>
        <div className="max-h-80 overflow-y-auto">
          {totalNotifications === 0 ? (
            <div className="p-6 text-center text-sm text-muted-foreground">
              <Bell className="h-8 w-8 mx-auto mb-2 text-muted-foreground/30" />
              Tidak ada notifikasi
            </div>
          ) : (
            <div className="p-2 space-y-2">
              {dueDates?.debts?.map((debt) => (
                <Card key={debt.id} className={`border-0 shadow-sm ${debt.status === "terlambat" ? "bg-red-50 dark:bg-red-950/20" : "bg-amber-50 dark:bg-amber-950/20"}`}>
                  <CardContent className="p-3">
                    <div className="flex items-start gap-2">
                      {debt.status === "terlambat" ? (
                        <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
                      ) : (
                        <Clock className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1 mb-0.5">
                          <span className="text-xs font-medium">
                            {debt.type === "hutang" ? "Hutang" : "Piutang"}
                          </span>
                          <Badge variant={debt.status === "terlambat" ? "destructive" : "secondary"} className="text-[10px] px-1 py-0">
                            {debt.status === "terlambat" ? "Terlambat" : "Segera"}
                          </Badge>
                        </div>
                        <p className="text-sm font-medium truncate">{debt.counterpartyName}</p>
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Calendar className="h-3 w-3" /> {debt.dueDate}
                          </span>
                          <span className="text-xs font-semibold">
                            {formatRupiah(debt.totalAmount - debt.paidAmount)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
