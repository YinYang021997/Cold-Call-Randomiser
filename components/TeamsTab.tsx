'use client';

import { useState, useCallback } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  useDraggable,
} from '@dnd-kit/core';
import {
  Box,
  Button,
  Typography,
  Paper,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  Tooltip,
  Alert,
  Select,
  MenuItem,
  FormControl,
  ToggleButton,
  ToggleButtonGroup,
  CircularProgress,
  Divider,
  InputLabel,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Group as GroupIcon,
  Person as PersonIcon,
  ViewList as ViewListIcon,
  ViewModule as ViewModuleIcon,
  Shuffle as ShuffleIcon,
} from '@mui/icons-material';
import {
  createTeamAction,
  updateTeamAction,
  deleteTeamAction,
  assignStudentToTeamAction,
  autoDistributeStudentsAction,
} from '@/app/(app)/classes/[classId]/actions';

// ── Types ──────────────────────────────────────────────────────────────────

interface Student {
  id: string;
  name: string;
  uni: string;
  teamId: string | null;
}

interface Team {
  id: string;
  name: string;
  color: string;
  students: Student[];
}

interface TeamsTabProps {
  classId: string;
  students: Student[];
  teams: Team[];
}

const COLOR_PALETTE = [
  '#1976d2',
  '#e91e63',
  '#9c27b0',
  '#ff9800',
  '#009688',
  '#795548',
];

// ── Draggable student chip (Board view) ───────────────────────────────────

function DraggableStudent({
  student,
  teamColor,
  isDragging,
}: {
  student: Student;
  teamColor?: string;
  isDragging?: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: student.id,
    data: { student },
  });

  const style = transform
    ? { transform: `translate(${transform.x}px, ${transform.y}px)`, zIndex: 999 }
    : undefined;

  return (
    <Chip
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      label={student.name}
      icon={<PersonIcon />}
      size="small"
      sx={{
        cursor: 'grab',
        opacity: isDragging ? 0.4 : 1,
        bgcolor: teamColor ? `${teamColor}22` : 'action.hover',
        border: `1px solid ${teamColor || '#ccc'}`,
        color: teamColor ? teamColor : 'text.primary',
        fontWeight: 500,
        '& .MuiChip-icon': { color: teamColor || 'text.secondary' },
        '&:active': { cursor: 'grabbing' },
        ...style,
      }}
    />
  );
}

// ── Droppable zone (Board view) ────────────────────────────────────────────

function DroppableZone({
  id,
  children,
  label,
  color,
  isEmpty,
}: {
  id: string;
  children: React.ReactNode;
  label?: string;
  color?: string;
  isEmpty?: boolean;
}) {
  const { isOver, setNodeRef } = useDroppable({ id });

  return (
    <Box
      ref={setNodeRef}
      sx={{
        minHeight: 80,
        p: 1.5,
        borderRadius: 1,
        border: `2px dashed ${isOver ? (color || '#1976d2') : 'rgba(0,0,0,0.15)'}`,
        bgcolor: isOver ? `${color || '#1976d2'}11` : 'transparent',
        transition: 'all 0.15s ease',
        display: 'flex',
        flexWrap: 'wrap',
        gap: 0.75,
        alignContent: 'flex-start',
      }}
    >
      {isEmpty && !isOver && (
        <Typography variant="caption" color="text.disabled" sx={{ width: '100%', textAlign: 'center', mt: 1 }}>
          {label || 'Drop students here'}
        </Typography>
      )}
      {children}
    </Box>
  );
}

// ── Create/Edit team dialog ────────────────────────────────────────────────

function TeamDialog({
  open,
  initial,
  onClose,
  onSave,
}: {
  open: boolean;
  initial?: { name: string; color: string };
  onClose: () => void;
  onSave: (name: string, color: string) => void;
}) {
  const [name, setName] = useState(initial?.name ?? '');
  const [color, setColor] = useState(initial?.color ?? COLOR_PALETTE[0]);
  const [nameError, setNameError] = useState('');

  const handleOpen = () => {
    setName(initial?.name ?? '');
    setColor(initial?.color ?? COLOR_PALETTE[0]);
    setNameError('');
  };

  const handleSave = () => {
    if (!name.trim()) { setNameError('Team name is required'); return; }
    onSave(name.trim(), color);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} onTransitionEnter={handleOpen} maxWidth="xs" fullWidth>
      <DialogTitle>{initial ? 'Rename Team' : 'Create Team'}</DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          label="Team name"
          value={name}
          onChange={(e) => { setName(e.target.value); setNameError(''); }}
          error={!!nameError}
          helperText={nameError}
          fullWidth
          sx={{ mt: 1, mb: 2 }}
          onKeyDown={(e) => e.key === 'Enter' && handleSave()}
        />
        <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
          Team color
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          {COLOR_PALETTE.map((c) => (
            <Box
              key={c}
              onClick={() => setColor(c)}
              sx={{
                width: 32, height: 32, borderRadius: '50%', bgcolor: c, cursor: 'pointer',
                border: color === c ? '3px solid rgba(0,0,0,0.5)' : '2px solid transparent',
                boxShadow: color === c ? `0 0 0 2px ${c}88` : 'none',
                transition: 'all 0.15s',
              }}
            />
          ))}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={handleSave}>
          {initial ? 'Save' : 'Create'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ── List view row ─────────────────────────────────────────────────────────

function StudentRow({
  student,
  teams,
  onAssign,
  saving,
}: {
  student: Student;
  teams: Team[];
  onAssign: (studentId: string, teamId: string | null) => void;
  saving: boolean;
}) {
  const currentTeam = teams.find((t) => t.id === student.teamId);

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1.5,
        py: 0.75,
        px: 1,
        borderRadius: 1,
        '&:hover': { bgcolor: 'action.hover' },
      }}
    >
      <Box
        sx={{
          width: 8,
          height: 8,
          borderRadius: '50%',
          bgcolor: currentTeam?.color ?? '#ccc',
          flexShrink: 0,
        }}
      />
      <Typography variant="body2" sx={{ flex: 1, minWidth: 0 }} noWrap>
        {student.name}
      </Typography>
      <Typography variant="caption" color="text.secondary" sx={{ width: 80, flexShrink: 0 }} noWrap>
        {student.uni}
      </Typography>
      <FormControl size="small" sx={{ minWidth: 150, flexShrink: 0 }}>
        <Select
          value={student.teamId ?? ''}
          onChange={(e) => onAssign(student.id, e.target.value || null)}
          disabled={saving}
          displayEmpty
          renderValue={(val) => {
            if (!val) return <Typography variant="body2" color="text.secondary">Unassigned</Typography>;
            const t = teams.find((t) => t.id === val);
            return (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: t?.color, flexShrink: 0 }} />
                <Typography variant="body2">{t?.name}</Typography>
              </Box>
            );
          }}
          sx={{ fontSize: '0.8rem' }}
        >
          <MenuItem value="">
            <Typography variant="body2" color="text.secondary">Unassigned</Typography>
          </MenuItem>
          <Divider />
          {teams.map((t) => (
            <MenuItem key={t.id} value={t.id}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: t.color }} />
                <Typography variant="body2">{t.name}</Typography>
              </Box>
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Box>
  );
}

// ── Main component ─────────────────────────────────────────────────────────

export function TeamsTab({ classId, students: initialStudents, teams: initialTeams }: TeamsTabProps) {
  const [students, setStudents] = useState<Student[]>(initialStudents);
  const [teams, setTeams] = useState<Team[]>(initialTeams);
  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [view, setView] = useState<'board' | 'list'>('list');
  const [savingStudentId, setSavingStudentId] = useState<string | null>(null);
  const [distributing, setDistributing] = useState(false);
  const [distributeConfirmOpen, setDistributeConfirmOpen] = useState(false);

  // Dialogs
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Team | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Team | null>(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const unassigned = students.filter((s) => s.teamId === null);
  const assigned = students.filter((s) => s.teamId !== null);

  const teamStudents = useCallback(
    (teamId: string) => students.filter((s) => s.teamId === teamId),
    [students],
  );

  const activeDragStudent = activeDragId ? students.find((s) => s.id === activeDragId) : null;
  const activeDragTeam = activeDragStudent?.teamId
    ? teams.find((t) => t.id === activeDragStudent.teamId)
    : null;

  // ── List view: instant assign via dropdown ───────────────────────────────

  const handleListAssign = async (studentId: string, teamId: string | null) => {
    const student = students.find((s) => s.id === studentId);
    if (!student || student.teamId === teamId) return;

    setSavingStudentId(studentId);
    setStudents((prev) => prev.map((s) => (s.id === studentId ? { ...s, teamId } : s)));

    const result = await assignStudentToTeamAction(studentId, teamId, classId);
    setSavingStudentId(null);
    if (result.error) {
      setStudents((prev) => prev.map((s) => (s.id === studentId ? { ...s, teamId: student.teamId } : s)));
      setError(result.error);
    }
  };

  // ── Auto-distribute ──────────────────────────────────────────────────────

  const handleAutoDistribute = async () => {
    setDistributeConfirmOpen(false);
    setDistributing(true);
    setError('');

    const result = await autoDistributeStudentsAction(classId);
    setDistributing(false);

    if (result.error) { setError(result.error); return; }

    if (result.assignments) {
      setStudents((prev) =>
        prev.map((s) => {
          const assignment = result.assignments!.find((a) => a.studentId === s.id);
          return assignment ? { ...s, teamId: assignment.teamId } : s;
        }),
      );
    }
  };

  // ── Board view: drag handlers ────────────────────────────────────────────

  const handleDragStart = (event: DragStartEvent) => {
    setActiveDragId(event.active.id as string);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveDragId(null);
    const { active, over } = event;
    if (!over) return;

    const studentId = active.id as string;
    const targetZone = over.id as string;
    const newTeamId = targetZone === 'unassigned' ? null : targetZone;

    const student = students.find((s) => s.id === studentId);
    if (!student || student.teamId === newTeamId) return;

    setStudents((prev) => prev.map((s) => (s.id === studentId ? { ...s, teamId: newTeamId } : s)));

    const result = await assignStudentToTeamAction(studentId, newTeamId, classId);
    if (result.error) {
      setStudents((prev) => prev.map((s) => (s.id === studentId ? { ...s, teamId: student.teamId } : s)));
      setError(result.error);
    }
  };

  // ── Team CRUD ────────────────────────────────────────────────────────────

  const handleCreateTeam = async (name: string, color: string) => {
    const result = await createTeamAction(classId, name, color);
    if (result.error) { setError(result.error); return; }
    if (result.team) setTeams((prev) => [...prev, { ...result.team!, students: [] }]);
  };

  const handleUpdateTeam = async (name: string, color: string) => {
    if (!editTarget) return;
    const result = await updateTeamAction(editTarget.id, classId, name, color);
    if (result.error) { setError(result.error); return; }
    setTeams((prev) => prev.map((t) => (t.id === editTarget.id ? { ...t, name, color } : t)));
    setEditTarget(null);
  };

  const handleDeleteTeam = async () => {
    if (!deleteTarget) return;
    const result = await deleteTeamAction(deleteTarget.id, classId);
    if (result.error) { setError(result.error); setDeleteTarget(null); return; }
    setStudents((prev) => prev.map((s) => (s.teamId === deleteTarget.id ? { ...s, teamId: null } : s)));
    setTeams((prev) => prev.filter((t) => t.id !== deleteTarget.id));
    setDeleteTarget(null);
  };

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <Box>
      {error && (
        <Alert severity="error" onClose={() => setError('')} sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Toolbar */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2, flexWrap: 'wrap' }}>
        <ToggleButtonGroup
          value={view}
          exclusive
          onChange={(_, v) => v && setView(v)}
          size="small"
        >
          <ToggleButton value="list">
            <Tooltip title="List view — fastest for bulk assignment">
              <ViewListIcon fontSize="small" />
            </Tooltip>
          </ToggleButton>
          <ToggleButton value="board">
            <Tooltip title="Board view — drag and drop">
              <ViewModuleIcon fontSize="small" />
            </Tooltip>
          </ToggleButton>
        </ToggleButtonGroup>

        <Button
          variant="outlined"
          startIcon={distributing ? <CircularProgress size={16} /> : <ShuffleIcon />}
          size="small"
          onClick={() => setDistributeConfirmOpen(true)}
          disabled={distributing || teams.length === 0 || unassigned.length === 0}
          color="secondary"
        >
          Auto-distribute ({unassigned.length} unassigned)
        </Button>

        <Box sx={{ flex: 1 }} />

        <Typography variant="body2" color="text.secondary">
          {assigned.length}/{students.length} assigned
        </Typography>

        <Button
          variant="contained"
          startIcon={<AddIcon />}
          size="small"
          onClick={() => setCreateOpen(true)}
        >
          Create Team
        </Button>
      </Box>

      {/* ── LIST VIEW ──────────────────────────────────────────────────── */}
      {view === 'list' && (
        <Box>
          {/* Team summary chips */}
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, mb: 2 }}>
            {teams.map((t) => {
              const count = students.filter((s) => s.teamId === t.id).length;
              return (
                <Chip
                  key={t.id}
                  label={`${t.name} (${count})`}
                  size="small"
                  icon={
                    <Box
                      component="span"
                      sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: t.color, ml: '6px !important' }}
                    />
                  }
                  sx={{ bgcolor: `${t.color}18`, border: `1px solid ${t.color}55`, color: t.color }}
                  onDelete={() => setEditTarget(t)}
                  deleteIcon={
                    <Tooltip title="Rename/recolor">
                      <EditIcon fontSize="small" />
                    </Tooltip>
                  }
                />
              );
            })}
            {teams.length === 0 && (
              <Typography variant="body2" color="text.secondary">
                No teams yet — create one to start assigning.
              </Typography>
            )}
          </Box>

          {/* Student rows */}
          <Paper variant="outlined" sx={{ overflow: 'hidden' }}>
            {/* Header */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, px: 1, py: 0.75, bgcolor: 'action.hover', borderBottom: '1px solid', borderColor: 'divider' }}>
              <Box sx={{ width: 8, flexShrink: 0 }} />
              <Typography variant="caption" fontWeight="bold" sx={{ flex: 1 }}>Student</Typography>
              <Typography variant="caption" fontWeight="bold" sx={{ width: 80, flexShrink: 0 }}>UNI</Typography>
              <Typography variant="caption" fontWeight="bold" sx={{ width: 150, flexShrink: 0 }}>Team</Typography>
            </Box>

            {/* Unassigned first */}
            {unassigned.length > 0 && (
              <Box>
                <Box sx={{ px: 1, py: 0.5, bgcolor: 'warning.50', borderBottom: '1px solid', borderColor: 'divider' }}>
                  <Typography variant="caption" color="warning.dark" fontWeight="bold">
                    UNASSIGNED ({unassigned.length})
                  </Typography>
                </Box>
                {unassigned.map((s) => (
                  <Box key={s.id} sx={{ borderBottom: '1px solid', borderColor: 'divider' }}>
                    <StudentRow
                      student={s}
                      teams={teams}
                      onAssign={handleListAssign}
                      saving={savingStudentId === s.id}
                    />
                  </Box>
                ))}
              </Box>
            )}

            {/* Grouped by team */}
            {teams.map((team) => {
              const members = students.filter((s) => s.teamId === team.id);
              if (members.length === 0) return null;
              return (
                <Box key={team.id}>
                  <Box sx={{ px: 1, py: 0.5, borderBottom: '1px solid', borderColor: 'divider', borderLeft: `3px solid ${team.color}` }}>
                    <Typography variant="caption" fontWeight="bold" sx={{ color: team.color }}>
                      {team.name.toUpperCase()} ({members.length})
                    </Typography>
                  </Box>
                  {members.map((s, idx) => (
                    <Box key={s.id} sx={{ borderBottom: idx < members.length - 1 ? '1px solid' : 'none', borderColor: 'divider' }}>
                      <StudentRow
                        student={s}
                        teams={teams}
                        onAssign={handleListAssign}
                        saving={savingStudentId === s.id}
                      />
                    </Box>
                  ))}
                </Box>
              );
            })}
          </Paper>
        </Box>
      )}

      {/* ── BOARD VIEW (drag & drop) ───────────────────────────────────── */}
      {view === 'board' && (
        <Box>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
            Drag students into teams. Drop back on <strong>Unassigned</strong> to remove from a team.
          </Typography>

          <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'repeat(3, 1fr)' }, gap: 2 }}>

              {/* Unassigned pool */}
              <Paper elevation={1} sx={{ p: 1.5, border: '1px solid', borderColor: 'divider' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <PersonIcon fontSize="small" color="action" />
                  <Typography variant="subtitle2" fontWeight="bold">Unassigned</Typography>
                  <Chip label={unassigned.length} size="small" variant="outlined" sx={{ ml: 'auto' }} />
                </Box>
                <DroppableZone id="unassigned" isEmpty={unassigned.length === 0} label="Drop here to unassign">
                  {unassigned.map((s) => (
                    <DraggableStudent key={s.id} student={s} isDragging={activeDragId === s.id} />
                  ))}
                </DroppableZone>
              </Paper>

              {/* Team cards */}
              {teams.map((team) => {
                const members = teamStudents(team.id);
                return (
                  <Paper key={team.id} elevation={1} sx={{ p: 1.5, border: `1px solid ${team.color}44`, borderTop: `3px solid ${team.color}` }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
                      <GroupIcon fontSize="small" sx={{ color: team.color }} />
                      <Typography variant="subtitle2" fontWeight="bold" sx={{ color: team.color, flex: 1 }}>
                        {team.name}
                      </Typography>
                      <Chip label={members.length} size="small" sx={{ bgcolor: `${team.color}22`, color: team.color }} />
                      <Tooltip title="Rename">
                        <IconButton size="small" onClick={() => setEditTarget(team)}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete team">
                        <IconButton size="small" color="error" onClick={() => setDeleteTarget(team)}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                    <DroppableZone id={team.id} color={team.color} isEmpty={members.length === 0}>
                      {members.map((s) => (
                        <DraggableStudent key={s.id} student={s} teamColor={team.color} isDragging={activeDragId === s.id} />
                      ))}
                    </DroppableZone>
                  </Paper>
                );
              })}
            </Box>

            <DragOverlay>
              {activeDragStudent ? (
                <Chip
                  label={activeDragStudent.name}
                  icon={<PersonIcon />}
                  size="small"
                  sx={{
                    cursor: 'grabbing',
                    bgcolor: activeDragTeam ? `${activeDragTeam.color}22` : 'action.hover',
                    border: `1px solid ${activeDragTeam?.color || '#ccc'}`,
                    color: activeDragTeam ? activeDragTeam.color : 'text.primary',
                    fontWeight: 500,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                    '& .MuiChip-icon': { color: activeDragTeam?.color || 'text.secondary' },
                  }}
                />
              ) : null}
            </DragOverlay>
          </DndContext>
        </Box>
      )}

      {/* Create team dialog */}
      <TeamDialog open={createOpen} onClose={() => setCreateOpen(false)} onSave={handleCreateTeam} />

      {/* Edit team dialog */}
      <TeamDialog
        open={!!editTarget}
        initial={editTarget ? { name: editTarget.name, color: editTarget.color } : undefined}
        onClose={() => setEditTarget(null)}
        onSave={handleUpdateTeam}
      />

      {/* Delete confirm */}
      <Dialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} maxWidth="xs">
        <DialogTitle>Delete team?</DialogTitle>
        <DialogContent>
          <Typography>
            Delete <strong>{deleteTarget?.name}</strong>? All students will be moved back to Unassigned.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteTarget(null)}>Cancel</Button>
          <Button variant="contained" color="error" onClick={handleDeleteTeam}>Delete</Button>
        </DialogActions>
      </Dialog>

      {/* Auto-distribute confirm */}
      <Dialog open={distributeConfirmOpen} onClose={() => setDistributeConfirmOpen(false)} maxWidth="xs">
        <DialogTitle>Auto-distribute students?</DialogTitle>
        <DialogContent>
          <Typography>
            Randomly assign all <strong>{unassigned.length} unassigned students</strong> evenly
            across <strong>{teams.length} teams</strong>. Already-assigned students are not moved.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDistributeConfirmOpen(false)}>Cancel</Button>
          <Button variant="contained" color="secondary" startIcon={<ShuffleIcon />} onClick={handleAutoDistribute}>
            Distribute
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
