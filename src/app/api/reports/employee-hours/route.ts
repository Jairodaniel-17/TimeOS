import { NextResponse } from 'next/server';
import { getUsers, getTimeEntries } from '@/lib/luma-docs';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const weekNumber = parseInt(searchParams.get('weekNumber') || '8');
    const year = parseInt(searchParams.get('year') || '2026');
    const userId = searchParams.get('userId');

    const [users, timeEntries] = await Promise.all([
      getUsers(),
      getTimeEntries({ weekNumber, year }),
    ]);

    // Filter users - if userId is provided, only return that user's data
    let filteredUsers = users;
    if (userId) {
      filteredUsers = users.filter(u => u.id === userId);
    }

    // Calculate status based on hours
    const HOURS_TARGET = 8;
    const HOURS_MINIMUM = 6;
    const weeklyTarget = HOURS_TARGET * 5;

    const formattedData = filteredUsers.map(user => {
      // Find all time entries for this user
      const userEntries = timeEntries.filter(e => e.userId === user.id);
      
      // Sum up hours for each day
      const dailyHours = {
        mon: 0,
        tue: 0,
        wed: 0,
        thu: 0,
        fri: 0,
        sat: 0,
        sun: 0,
      };
      
      let total = 0;
      
      for (const entry of userEntries) {
        dailyHours.mon += entry.hours.mon;
        dailyHours.tue += entry.hours.tue;
        dailyHours.wed += entry.hours.wed;
        dailyHours.thu += entry.hours.thu;
        dailyHours.fri += entry.hours.fri;
        dailyHours.sat += entry.hours.sat;
        dailyHours.sun += entry.hours.sun;
        total += entry.total;
      }
      
      const avgDailyHours = total / 5;
      
      let status: 'green' | 'blue' | 'red' | 'orange' | 'yellow';
      let statusLabel: string;

      if (total === 0) {
        status = 'red';
        statusLabel = 'Sin registro';
      } else if (total < HOURS_MINIMUM * 5) {
        status = 'orange';
        statusLabel = 'Bajo registro';
      } else if (total < weeklyTarget) {
        status = 'yellow';
        statusLabel = 'Parcial';
      } else if (total === weeklyTarget) {
        status = 'green';
        statusLabel = 'Completado';
      } else {
        status = 'blue';
        statusLabel = 'Horas extra';
      }

      return {
        userId: user.id,
        userName: user.name,
        dailyHours,
        totalHours: total,
        averageDailyHours: Math.round(avgDailyHours * 100) / 100,
        status,
        statusLabel,
        completionPercentage: Math.round((total / weeklyTarget) * 100),
      };
    });

    // Calculate summary statistics
    const summary = {
      totalEmployees: formattedData.length,
      completed: formattedData.filter(e => e.status === 'green').length,
      overTime: formattedData.filter(e => e.status === 'blue').length,
      noEntry: formattedData.filter(e => e.status === 'red').length,
      lowEntry: formattedData.filter(e => e.status === 'orange').length,
      partial: formattedData.filter(e => e.status === 'yellow').length,
      totalHours: formattedData.reduce((sum, e) => sum + e.totalHours, 0),
      averageHours: Math.round((formattedData.reduce((sum, e) => sum + e.totalHours, 0) / formattedData.length) * 100) / 100,
    };

    return NextResponse.json({ 
      data: {
        employees: formattedData,
        summary,
        weekNumber,
        year,
      },
      success: true 
    });
  } catch (error) {
    console.error('Error fetching employee hours report:', error);
    return NextResponse.json(
      { error: 'Failed to fetch report', success: false },
      { status: 500 }
    );
  }
}