package com.citypulse;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * Punto de entrada del backend de City Pulse, la cartelera digital de eventos locales.
 *
 * @author Santiago Rivas
 */
@SpringBootApplication
public class CityPulseApplication {

    public static void main(String[] args) {
        SpringApplication.run(CityPulseApplication.class, args);
    }

}
