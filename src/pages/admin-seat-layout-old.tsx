import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaSave, FaEraser, FaInfo, FaLayerGroup } from 'react-icons/fa';
import AdminLayout from '../components/AdminLayout';
import api from '../lib/api';

interface SeatCell {
  seatNumber: string;
}

interface Bus {
  id: string;
  busNumber: string;
  name: string;
  gridRows: number;
  gridColumns: number;
}

interface ExistingSeat {
  id: string;
  seatNumber: string;
  row: number;
  column: number;
  rowSpan: number;
  columnSpan: number;
  type: string;
  level: string;
  isActive: boolean;
}

const SeatLayoutDesigner: React.FC = () => {
  const { busId } = useParams<{ busId: string }>();
  const navigate = useNavigate();

  const [bus, setBus] = useState<Bus | null>(null);
  const [activeLevel, setActiveLevel] = useState<'LOWER' | 'UPPER'>('LOWER');
  const [lowerDeckGrid, setLowerDeckGrid] = useState<SeatCell[][]>([]);
  const [upperDeckGrid, setUpperDeckGrid] = useState<SeatCell[][]>([]);
  const [selectedCell, setSelectedCell] = useState<{row: number; col: number} | null>(null);
  const [seatNumberInput, setSeatNumberInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (busId) {
      fetchBusAndSeats();
    }
  }, [busId]);

  const fetchBusAndSeats = async () => {
    try {
      // Fetch bus details
      const busResponse = await api.get(`/admin/bus/${busId}`);
      const busData = busResponse.data.bus;
      setBus(busData);

      // Initialize empty grids
      const emptyLower = createEmptyGrid(busData.gridRows, busData.gridColumns);
      const emptyUpper = createEmptyGrid(busData.gridRows, busData.gridColumns);

      // Fetch existing seat layout
      try {
        const seatsResponse = await api.get(`/admin/bus/${busId}/seats`);
        const { lowerDeck, upperDeck } = seatsResponse.data.seats;

        // Fill grids with existing seats
        populateGridWithSeats(emptyLower, lowerDeck);
        populateGridWithSeats(emptyUpper, upperDeck);
      } catch (err) {
        // No seats yet, use empty grids
      }

      setLowerDeckGrid(emptyLower);
      setUpperDeckGrid(emptyUpper);
    } catch (err: any) {
      setError(err.response?.data?.errorMessage || 'Failed to load bus details');
    } finally {
      setLoading(false);
    }
  };

  const createEmptyGrid = (rows: number, cols: number): SeatCell[][] => {
    return Array(rows).fill(null).map(() =>
      Array(cols).fill(null).map(() => ({ seatNumber: '' }))
    );
  };

  const populateGridWithSeats = (grid: SeatCell[][], seats: ExistingSeat[]) => {
    seats.forEach((seat) => {
      const { row, column, rowSpan, columnSpan, seatNumber } = seat;
      // Fill all cells occupied by this seat
      for (let r = row; r < row + rowSpan; r++) {
        for (let c = column; c < column + columnSpan; c++) {
          if (grid[r] && grid[r][c]) {
            grid[r][c].seatNumber = seatNumber;
          }
        }
      }
    });
  };

  const handleCellClick = (row: number, col: number) => {
    setSelectedCell({ row, col });
    const currentGrid = activeLevel === 'LOWER' ? lowerDeckGrid : upperDeckGrid;
    setSeatNumberInput(currentGrid[row][col].seatNumber);
  };

  const handleSetSeatNumber = () => {
    if (!selectedCell) return;

    const { row, col } = selectedCell;
    const currentGrid = activeLevel === 'LOWER' ? lowerDeckGrid : upperDeckGrid;
    const newGrid = currentGrid.map((r, i) =>
      i === row
        ? r.map((cell, j) => (j === col ? { seatNumber: seatNumberInput } : cell))
        : r
    );

    if (activeLevel === 'LOWER') {
      setLowerDeckGrid(newGrid);
    } else {
      setUpperDeckGrid(newGrid);
    }

    // Check if user wants to create sleeper by entering same number in adjacent cell
    const adjacentRight = col + 1 < newGrid[0].length ? newGrid[row][col + 1] : null;
    const adjacentBelow = row + 1 < newGrid.length ? newGrid[row + 1][col] : null;

    if (seatNumberInput) {
      // If adjacent cell is empty, suggest making it a sleeper
      if (adjacentRight && !adjacentRight.seatNumber) {
        if (window.confirm(`Make seat ${seatNumberInput} a horizontal sleeper? (Click Yes to fill right cell)`)) {
          const sleeperGrid = newGrid.map((r, i) =>
            i === row
              ? r.map((cell, j) => (j === col + 1 ? { seatNumber: seatNumberInput } : cell))
              : r
          );
          if (activeLevel === 'LOWER') {
            setLowerDeckGrid(sleeperGrid);
          } else {
            setUpperDeckGrid(sleeperGrid);
          }
        }
      } else if (adjacentBelow && !adjacentBelow.seatNumber) {
        if (window.confirm(`Make seat ${seatNumberInput} a vertical sleeper? (Click Yes to fill below cell)`)) {
          const sleeperGrid = newGrid.map((r, i) =>
            i === row + 1
              ? r.map((cell, j) => (j === col ? { seatNumber: seatNumberInput } : cell))
              : r
          );
          if (activeLevel === 'LOWER') {
            setLowerDeckGrid(sleeperGrid);
          } else {
            setUpperDeckGrid(sleeperGrid);
          }
        }
      }
    }

    setSeatNumberInput('');
    setSelectedCell(null);
  };

  const handleClearCell = () => {
    if (!selectedCell) return;

    const { row, col } = selectedCell;
    const currentGrid = activeLevel === 'LOWER' ? lowerDeckGrid : upperDeckGrid;
    const newGrid = currentGrid.map((r, i) =>
      i === row
        ? r.map((cell, j) => (j === col ? { seatNumber: '' } : cell))
        : r
    );

    if (activeLevel === 'LOWER') {
      setLowerDeckGrid(newGrid);
    } else {
      setUpperDeckGrid(newGrid);
    }

    setSeatNumberInput('');
    setSelectedCell(null);
  };

  const handleSaveLayout = async () => {
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      await api.post(`/admin/bus/${busId}/seats/layout`, {
        lowerDeckGrid,
        upperDeckGrid: upperDeckGrid.some(row => row.some(cell => cell.seatNumber)) ? upperDeckGrid : undefined,
      });

      setSuccess('Seat layout saved successfully!');
      setTimeout(() => {
        navigate('/admin/buses');
      }, 2000);
    } catch (err: any) {
      setError(err.response?.data?.errorMessage || 'Failed to save layout');
    } finally {
      setSaving(false);
    }
  };

  const countSeats = (grid: SeatCell[][]) => {
    const uniqueSeats = new Set<string>();
    grid.forEach(row => {
      row.forEach(cell => {
        if (cell.seatNumber) uniqueSeats.add(cell.seatNumber);
      });
    });
    return uniqueSeats.size;
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500"></div>
        </div>
      </AdminLayout>
    );
  }

  if (!bus) {
    return (
      <AdminLayout>
        <div className="text-center py-12">
          <p className="text-red-600">Bus not found</p>
        </div>
      </AdminLayout>
    );
  }

  const currentGrid = activeLevel === 'LOWER' ? lowerDeckGrid : upperDeckGrid;

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Seat Layout Designer</h1>
          <p className="text-gray-600 mt-1">
            {bus.busNumber} - {bus.name}
          </p>
        </div>

        {/* Messages */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}
        {success && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg">
            {success}
          </div>
        )}

        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <FaInfo className="text-blue-600 text-xl mt-1" />
            <div className="text-sm text-blue-800 space-y-1">
              <p><strong>How to use:</strong></p>
              <ul className="list-disc list-inside space-y-1">
                <li>Click a cell to select it</li>
                <li>Enter seat number (e.g., "1", "2", "3")</li>
                <li>For sleeper seats: Enter same number in 2 adjacent cells (horizontal or vertical)</li>
                <li>Leave cells empty for aisles or non-seat areas</li>
                <li>Switch between Lower and Upper deck using tabs</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Deck Selector and Stats */}
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-2 bg-white rounded-lg shadow p-1">
            <button
              onClick={() => setActiveLevel('LOWER')}
              className={`px-6 py-2 rounded-md transition flex items-center space-x-2 ${
                activeLevel === 'LOWER'
                  ? 'bg-yellow-500 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <FaLayerGroup />
              <span>Lower Deck</span>
            </button>
            <button
              onClick={() => setActiveLevel('UPPER')}
              className={`px-6 py-2 rounded-md transition flex items-center space-x-2 ${
                activeLevel === 'UPPER'
                  ? 'bg-yellow-500 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <FaLayerGroup />
              <span>Upper Deck</span>
            </button>
          </div>

          <div className="bg-white rounded-lg shadow px-6 py-3">
            <p className="text-sm text-gray-600">Total Seats</p>
            <p className="text-2xl font-bold text-gray-800">
              {countSeats(lowerDeckGrid) + countSeats(upperDeckGrid)}
            </p>
          </div>
        </div>

        {/* Grid */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="overflow-x-auto">
            <div className="inline-block">
              <div className="mb-4 text-center text-sm text-gray-600 font-semibold">
                {activeLevel} DECK - FRONT →
              </div>
              {currentGrid.map((row, rowIndex) => (
                <div key={rowIndex} className="flex">
                  {row.map((cell, colIndex) => (
                    <button
                      key={`${rowIndex}-${colIndex}`}
                      onClick={() => handleCellClick(rowIndex, colIndex)}
                      className={`w-12 h-12 m-0.5 border-2 rounded text-xs font-bold transition ${
                        selectedCell?.row === rowIndex && selectedCell?.col === colIndex
                          ? 'border-yellow-500 bg-yellow-100 ring-2 ring-yellow-500'
                          : cell.seatNumber
                          ? 'border-green-500 bg-green-100 hover:bg-green-200'
                          : 'border-gray-300 bg-gray-50 hover:bg-gray-100'
                      }`}
                    >
                      {cell.seatNumber}
                    </button>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Control Panel */}
        {selectedCell && (
          <div className="bg-white rounded-xl shadow-md p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">
              Edit Cell ({selectedCell.row + 1}, {selectedCell.col + 1})
            </h3>
            <div className="flex items-center space-x-4">
              <input
                type="text"
                value={seatNumberInput}
                onChange={(e) => setSeatNumberInput(e.target.value)}
                placeholder="Enter seat number"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500"
                onKeyPress={(e) => e.key === 'Enter' && handleSetSeatNumber()}
              />
              <button
                onClick={handleSetSeatNumber}
                className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition"
              >
                Set
              </button>
              <button
                onClick={handleClearCell}
                className="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition flex items-center space-x-2"
              >
                <FaEraser />
                <span>Clear</span>
              </button>
            </div>
          </div>
        )}

        {/* Save Button */}
        <div className="flex justify-end space-x-4">
          <button
            onClick={() => navigate('/admin/buses')}
            className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSaveLayout}
            disabled={saving || countSeats(lowerDeckGrid) === 0}
            className="px-6 py-3 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FaSave />
            <span>{saving ? 'Saving...' : 'Save Layout'}</span>
          </button>
        </div>
      </div>
    </AdminLayout>
  );
};

export default SeatLayoutDesigner;
