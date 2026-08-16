/**
 * Navbat tizimi biznes xatoliklari klasslari
 */

export class BookingError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'BookingError';
  }
}

export class SlotUnavailableError extends BookingError {
  constructor(message = "Tanlangan vaqt oralig'i band. Iltimos, boshqa vaqtni tanlang.") {
    super(message);
    this.name = 'SlotUnavailableError';
  }
}

export class OutsideWorkingHoursError extends BookingError {
  constructor(message = "Tanlangan vaqt sartaroshxona ish vaqtidan tashqarida.") {
    super(message);
    this.name = 'OutsideWorkingHoursError';
  }
}

export class PastSlotError extends BookingError {
  constructor(message = "O'tib ketgan vaqtga navbat olib bo'lmaydi.") {
    super(message);
    this.name = 'PastSlotError';
  }
}

export class InvalidStatusTransitionError extends BookingError {
  constructor(message = "Holatni bunday o'zgartirishga ruxsat berilmagan.") {
    super(message);
    this.name = 'InvalidStatusTransitionError';
  }
}

export class PermissionDeniedError extends BookingError {
  constructor(message = "Bu amalni bajarish uchun sizda yetarli huquq yo'q.") {
    super(message);
    this.name = 'PermissionDeniedError';
  }
}
