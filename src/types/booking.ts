export type SeatType = "SEATER" | "SLEEPER";
export type SeatLevel = "LOWER" | "UPPER";
export type StopPointType = "BOARDING" | "DROPPING";

export interface Seat {
  id: string;
  seatNumber: string;
  row: number;
  column: number;
  rowSpan: number;
  columnSpan: number;
  type: SeatType;
  level: SeatLevel;
  isAvailable: boolean;
}

export interface StopPointOption {
  id: string;
  name: string;
  time: string;
  type: StopPointType;
  landmark?: string | null;
  address?: string | null;
  pointOrder: number;
}

export interface RouteStop {
  id: string;
  name: string;
  city: string;
  state?: string | null;
  stopIndex: number;
  arrivalTime: string | null;
  departureTime: string | null;
  returnArrivalTime: string | null;
  returnDepartureTime: string | null;
  boardingPoints: StopPointOption[];
}

export interface BusImage {
  id: string;
  imageUrl: string;
  createdAt: string;
}

export interface BusInfo {
  trip: {
    id: string;
    tripDate: string;
    status: string;
  };
  bus: {
    id: string;
    busNumber: string;
    name: string;
    type: string;
    layoutType: string;
    totalSeats: number;
    gridRows: number;
    gridColumns: number;
    images?: BusImage[];
  };
  route: {
    fromStop: {
      id: string;
      name: string;
      city: string;
      departureTime: string | null;
      lowerSeaterPrice: number;
      lowerSleeperPrice: number;
      upperSleeperPrice: number;
      boardingPoints: StopPointOption[];
    };
    toStop: {
      id: string;
      name: string;
      city: string;
      arrivalTime: string | null;
      lowerSeaterPrice: number;
      lowerSleeperPrice: number;
      upperSleeperPrice: number;
      boardingPoints: StopPointOption[];
    };
    fare: number;
    isReturnTrip: boolean;
    path: RouteStop[];
    boardingPoints: StopPointOption[];
    droppingPoints: StopPointOption[];
  };
  seats: {
    lowerDeck: Seat[];
    upperDeck: Seat[];
    availableCount: number;
  };
}
