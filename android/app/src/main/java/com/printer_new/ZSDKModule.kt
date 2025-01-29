package com.printer_new

import android.util.Log
import com.facebook.react.bridge.Callback
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.zebra.sdk.comm.BluetoothConnection
import com.zebra.sdk.comm.Connection
import com.zebra.sdk.comm.ConnectionException
import com.zebra.sdk.printer.PrinterLanguage
import com.zebra.sdk.printer.ZebraPrinterFactory
import com.zebra.sdk.printer.ZebraPrinterLanguageUnknownException
import com.zebra.sdk.printer.discovery.BluetoothDiscoverer
import com.zebra.sdk.printer.discovery.DiscoveredPrinter
import com.zebra.sdk.printer.discovery.DiscoveredPrinterBluetooth
import com.zebra.sdk.printer.discovery.DiscoveryHandler
import org.json.JSONArray
import org.json.JSONObject

class ZSDKModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String {
        return "ZSDKModule"
    }

    @ReactMethod
    fun zsdkWriteBluetooth(macAddress: String, zpl: String) {
        Log.d("ZSDKModule", "Going to write via Bluetooth with MAC address: $macAddress and zpl: $zpl")

        var printerConnection: Connection? = null

        try {
            printerConnection = BluetoothConnection(macAddress)
            printerConnection.open()

            if (printerConnection.isConnected) {
                val printer = ZebraPrinterFactory.getInstance(printerConnection)
                val printerLanguage = printer.printerControlLanguage
                val testLabel = getTestLabel(printerLanguage)
                printerConnection.write(testLabel)
            }
        } catch (e: ConnectionException) {
            Log.e("ZSDKModule", "ConnectionException: ${e.message}", e)
        } catch (e: ZebraPrinterLanguageUnknownException) {
            Log.e("ZSDKModule", "PrinterLanguageUnknownException: ${e.message}", e)
        } finally {
            try {
                printerConnection?.close()
            } catch (ex: ConnectionException) {
                Log.e("ZSDKModule", "Error closing connection: ${ex.message}", ex)
            }
        }
    }

    private fun getTestLabel(printerLanguage: PrinterLanguage): ByteArray {
        return when (printerLanguage) {
            PrinterLanguage.ZPL -> "^XA^FO17,16^GB379,371,8^FS^FT65,255^A0N,135,134^FDTEST^FS^XZ".toByteArray()
            PrinterLanguage.CPCL, PrinterLanguage.LINE_PRINT -> {
                val cpclConfigLabel = """! 0 200 200 406 1\r\n" +
                        "ON-FEED IGNORE\r\n" +
                        "BOX 20 20 380 380 8\r\n" +
                        "T 0 6 137 177 TEST\r\n" +
                        "PRINT\r\n"""
                cpclConfigLabel.toByteArray()
            }
            else -> ByteArray(0)
        }
    }

    @ReactMethod
    fun zsdkPrinterDiscoveryBluetooth(callback: Callback) {
        try {
            BluetoothDiscoverer.findPrinters(reactApplicationContext, DiscoveryResult(callback))
        } catch (e: ConnectionException) {
            Log.e("ZSDKModule", "Discovery error: ${e.message}", e)
        }
    }

    private class DiscoveryResult(private val callback: Callback) : DiscoveryHandler {

        private val foundPrinterList = mutableListOf<Map<String, String>>()

        override fun foundPrinter(printer: DiscoveredPrinter) {
            val discoveredPrinter = printer as? DiscoveredPrinterBluetooth
            val foundPrinter = mapOf(
                "address" to printer.address,
                "friendlyName" to (discoveredPrinter?.friendlyName ?: "Unknown")
            )
            foundPrinterList.add(foundPrinter)
        }

        override fun discoveryFinished() {
            val jsonArray = JSONArray()

            for (printer in foundPrinterList) {
                jsonArray.put(JSONObject(printer))
            }

            Log.d("ZSDKModule", "Found printers: $jsonArray")
            callback.invoke(null, jsonArray.toString())
        }

        override fun discoveryError(message: String) {
            Log.e("ZSDKModule", "Discovery error: $message")
            callback.invoke(message, null)
        }
    }
}