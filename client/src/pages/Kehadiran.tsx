import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Clock, CheckCircle2, AlertCircle, CalendarDays, Users, Download,
  ChevronRight, LogIn, LogOut
} from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

export default function Kehadiran() {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));
  const [showMonthly, setShowMonthly] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));

  const { data: todayAttendance } = trpc.attendance.today.useQuery();
  const { data: listAttendance, isLoading: listLoading } = trpc.attendance.list.useQuery(
    { startDate: selectedDate, endDate: selectedDate }
  );
  const { data: reportData } = trpc.attendance.report.useQuery(
    { startDate: selectedDate, endDate: selectedDate },
    { enabled: !showMonthly }
  );
  const { data: monthlyData } = trpc.attendance.myReport.useQuery(
    {
      startDate: `${selectedMonth}-01`,
      endDate: `${selectedMonth}-${new Date(parseInt(selectedMonth.split("-")[0]), parseInt(selectedMonth.split("-")[1]), 0).getDate()}`,
    },
    { enabled: showMonthly }
  );

  const utils = trpc.useUtils();

  const clockInMut = trpc.attendance.clockIn.useMutation({
    onSuccess: (): void => {
      utils.attendance.today.invalidate();
      utils.attendance.list.invalidate();
      toast.success("Clock in berhasil!");
    },
    onError: (e: any) => { toast.error(e.message); },
  });

  const clockOutMut = trpc.attendance.clockOut.useMutation({
    onSuccess: (): void => {
      utils.attendance.today.invalidate();
      utils.attendance.list.invalidate();
      toast.success("Clock out berhasil!");
    },
    onError: (e: any) => { toast.error(e.message); },
  });

  function handleClockIn() {
    clockInMut.mutate();
  }

  function handleClockOut() {
    const today = todayAttendance?.[0];
    if (today?.id) {
      clockOutMut.mutate({ id: today.id });
    }
  }

  const getStatus = (record: any): string => {
    if (!record.clockIn) return "absent";
    if (!record.clockOut) return "active";
    return "completed";
  };

  const totalPresent = reportData?.length || 0;
  const totalLate = 0; // TODO: determine late status from business logic
  const totalAbsent = 0; // TODO: determine absent status from business logic

  const formatTime = (date: string | Date | null | undefined): string => {
    if (!date) return "-";
    return new Date(date).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
  };

  const formatDuration = (hoursWorked: string | number | null | undefined): string => {
    if (!hoursWorked) return "-";
    const hours = parseFloat(String(hoursWorked));
    if (isNaN(hours)) return "-";
    const wholeHours = Math.floor(hours);
    const mins = Math.round((hours - wholeHours) * 60);
    return `${wholeHours}h ${mins}m`;
  };

  return (
    <div className="space-y-6 p-4 md:p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Clock className="h-6 w-6 text-[#1E4D9B]" />
            Kehadiran Pegawai
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Manajemen clock in/out dan laporan kehadiran</p>
        </div>
      </div>

      {/* Today's Clock In/Out */}
      {!showMonthly && (
        <Card className="border-0 shadow-md bg-gradient-to-br from-blue-50 to-indigo-50">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
              <div>
                <p className="text-sm text-muted-foreground mb-2">Status Hari Ini</p>
                {todayAttendance && todayAttendance.length > 0 ? (
                  <div className="space-y-2">
                    {(() => {
                      const today = todayAttendance[0];
                      return (
                        <>
                          <p className="text-lg font-semibold">
                            Clock In: {formatTime(today.clockIn)}
                          </p>
                          {today.clockOut ? (
                            <>
                              <p className="text-lg font-semibold">
                                Clock Out: {formatTime(today.clockOut)}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                Total: {formatDuration(parseFloat(today.hoursWorked || "0") * 60)}
                              </p>
                            </>
                          ) : (
                            <Badge className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200">Sedang Bekerja</Badge>
                          )}
                        </>
                      );
                    })()}
                  </div>
                ) : (
                  <p className="text-muted-foreground">Belum clock in hari ini</p>
                )}
              </div>

              <div className="flex gap-2">
                {!todayAttendance || todayAttendance.length === 0 ? (
                  <Button
                    onClick={handleClockIn}
                    disabled={clockInMut.isPending}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <LogIn className="h-4 w-4 mr-2" />
                    Clock In
                  </Button>
                ) : todayAttendance[0] && !todayAttendance[0].clockOut ? (
                  <Button
                    onClick={handleClockOut}
                    disabled={clockOutMut.isPending}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Clock Out
                  </Button>
                ) : null}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats */}
      {!showMonthly && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="border-0 shadow-md">
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">{totalPresent}</div>
              <div className="text-xs text-muted-foreground">Hadir</div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-md">
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">{totalLate}</div>
              <div className="text-xs text-muted-foreground">Telat</div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-md">
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-red-600 dark:text-red-400">{totalAbsent}</div>
              <div className="text-xs text-muted-foreground">Absen</div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-md">
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{listAttendance?.length || 0}</div>
              <div className="text-xs text-muted-foreground">Total Pegawai</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* View Toggle */}
      <div className="flex gap-2">
        <Button
          variant={!showMonthly ? "default" : "outline"}
          onClick={() => setShowMonthly(false)}
        >
          <CalendarDays className="h-4 w-4 mr-2" />
          Harian
        </Button>
        <Button
          variant={showMonthly ? "default" : "outline"}
          onClick={() => setShowMonthly(true)}
        >
          <CalendarDays className="h-4 w-4 mr-2" />
          Bulanan
        </Button>
      </div>

      {/* Date Picker */}
      {!showMonthly && (
        <div className="flex gap-2">
          <Input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="max-w-xs"
          />
        </div>
      )}

      {/* Month Picker */}
      {showMonthly && (
        <div className="flex gap-2">
          <Input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="max-w-xs"
          />
        </div>
      )}

      {/* Daily Attendance List */}
      {!showMonthly && (
        <>
          {listLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-20 w-full rounded-lg" />)}
            </div>
          ) : listAttendance && listAttendance.length > 0 ? (
            <div className="space-y-3">
              <h3 className="font-semibold text-lg">Kehadiran {selectedDate}</h3>
              {listAttendance.map((record) => {
                const status = getStatus(record);
                const statusLabel = status === "completed" ? "Selesai" : status === "active" ? "Aktif" : "Absen";
                return (
                  <motion.div
                    key={record.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h4 className="font-semibold">{record.userName}</h4>
                        <div className="text-sm text-muted-foreground space-y-1 mt-2">
                          <p>In: {formatTime(record.clockIn)}</p>
                          <p>Out: {formatTime(record.clockOut)}</p>
                          {record.hoursWorked && <p>Duration: {formatDuration(record.hoursWorked)}</p>}
                        </div>
                      </div>
                      <Badge
                        className={
                          status === "completed" ? "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200" :
                          status === "active" ? "bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200" :
                          "bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200"
                        }
                      >
                        {statusLabel}
                      </Badge>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <Card className="border-0 shadow-md">
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <Users className="h-12 w-12 text-muted-foreground/30 mb-4" />
                <p className="text-muted-foreground">Tidak ada data kehadiran untuk tanggal ini</p>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Monthly Attendance View */}
      {showMonthly && monthlyData && (
        <div>
          <h3 className="font-semibold text-lg mb-4">Laporan Bulan {selectedMonth}</h3>
          <div className="grid gap-4">
            {monthlyData.length > 0 ? (
              monthlyData.map((record) => {
                const status = getStatus(record);
                const statusLabel = status === "completed" ? "Selesai" : status === "active" ? "Aktif" : "Absen";
                return (
                  <motion.div
                    key={record.date}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="border rounded-lg p-4"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold">{record.date}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatTime(record.clockIn)} - {formatTime(record.clockOut)}
                        </p>
                      </div>
                      <div className="text-right">
                        <Badge
                          className={
                            status === "completed" ? "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200" :
                            status === "active" ? "bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200" :
                            "bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200"
                          }
                        >
                          {statusLabel}
                        </Badge>
                        {record.hoursWorked && (
                          <p className="text-sm text-muted-foreground mt-2">
                            {formatDuration(record.hoursWorked)}
                          </p>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })
            ) : (
              <Card className="border-0 shadow-md">
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                  <AlertCircle className="h-12 w-12 text-muted-foreground/30 mb-4" />
                  <p className="text-muted-foreground">Tidak ada data kehadiran untuk bulan ini</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
