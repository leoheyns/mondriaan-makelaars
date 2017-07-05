<!DOCTYPE html>
<html lang="en">
    <head>
		<link rel="stylesheet" href="tabelopmaak.css" />
        <link href="https://fonts.googleapis.com/css?family=Jim+Nightshade|Roboto:100" rel="stylesheet">
        <meta charset="utf-8">
        <meta http-equiv="X-UA-Compatible" content="IE=edge">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <meta name="description" content="">
        <meta name="author" content="">
        <title>Mondriaan Makelaars</title>
        <!-- Bootstrap core CSS -->
        <link href="bootstrap/css/bootstrap.css" rel="stylesheet">
        <!-- Custom styles for this template -->
        <link href="starter-template.css" rel="stylesheet">
        <!-- HTML5 shim and Respond.js for IE8 support of HTML5 elements and media queries -->
        <!--[if lt IE 9]>
      <script src="https://oss.maxcdn.com/html5shiv/3.7.2/html5shiv.min.js"></script>
      <script src="https://oss.maxcdn.com/respond/1.4.2/respond.min.js"></script>
    <![endif]-->
 </head>
    <body>
        <nav class="navbar navbar-inverse navbar-fixed-top">
            <div class="container">
                <div class="col-md-1">
                    <a href="#" class="thumbnail">
                        <img src="Mondriaan%2520logo.png" alt="">
                    </a>
                </div>
                <div id="navbar" class="collapse navbar-collapse">
					<form class="form" action="website1home.html">
						<button class="menuknop" type="submit">Home</button>
					</form>
                    <form class="form" action="website1-aanbod.php">
						<button type="submit" class="menuknop">Aanbod</button>
                    </form>
					<div class="btn-group">
                        <button type="button" class="dropdown-toggle menuknop" data-toggle="dropdown">    Diensten
                            <span class="caret"></span>
                        </button>
                        <ul class="dropdown-menu" role="menu">
                            <li>
                               	<form class="form" action="website1-aankoop.html">
									<button class="dropdownknop" type="submit">Aankoopmakelaar</button>
								</form>
                            </li>
                            <li>
                                <form class="form" action="website1-verkoop.html">
									<button class="dropdownknop" type="submit">Verkoopmakelaar</button>
								</form>
                            </li>
                            <li>
                                <form class="form" action="website1-taxatie.html">
									<button class="dropdownknop" type="submit">Taxatie</button>
								</form>
                            </li>
                        </ul>
                    </div>
                    <form class="form" action="website1-info.html">
						<button type="submit" class="menuknop">Informatie</button>
                    </form>
					<form class="form" action="website1-contact.html">
						<button type="submit" class="menuknop menuknop:hover">Contact</button>
                    </form>
					<form class="form" action="website1-over.html">
						<button type="submit" class="menuknop menuknop:hover">Over ons</button>
					</form>
                </div>
                <!--/.nav-collapse -->
            </div>
        </nav>
		<center>
<?php
$KostenMaxLast = $_POST["KostenMax"];
$KostenMinLast = $_POST["KostenMin"];
$SlaapkamersLast = $_POST["Slaapkamers"];
$RegioLast = $_POST["Regio"];
$TypeLast = $_POST["Type"];
$RichtingTuinLast = $_POST["RichtingTuin"];
$OppHuisMinLast = $_POST["OppervlakteHuisMin"];
$OppHuisMaxLast = $_POST["OppervlakteHuisMax"];
$OppGrondMinLast = $_POST["OppervlakteGrondMin"];
$OppGrondMaxLast = $_POST["OppervlakteGrondMax"];
$mysql = mysql_connect("185.56.145.84","retorq1q","cnxdWK4H") or die("Fout: Er is geen verbinding met de MySQL-server tot stand gebracht!");
mysql_select_db("retorq1q_makelaars",$mysql) or die("Fout: Het openen van de database is mislukt!");
$resultaat = mysql_query("SELECT DISTINCT RegioPand FROM panden",$mysql) or die("De query op de database is mislukt!");
mysql_close($mysql) or die("Het verbreken van de verbinding met de MySQL-server is mislukt!");
?>
// Form
<form action="website1-aanbod.php" method="post">
Regio:
<select name="Regio" >
<option value='Alle'>Alle</option>
<?php
while(list($Regio) = mysql_fetch_row($resultaat))
{
	if($Regio == $RegioLast){
		print("<option value='$Regio' selected='selected'>$Regio</option>");
	}
	else{
		print("<option value='$Regio'>$Regio</option>");
	}
}
?>
</select><br />

<br />
<br />
<br />
<br />
<?php
$mysql = mysql_connect("185.56.145.84","retorq1q","cnxdWK4H") or die("Fout: Er is geen verbinding met de MySQL-server tot stand gebracht!");
mysql_select_db("retorq1q_makelaars",$mysql) or die("Fout: Het openen van de database is mislukt!");
$resultaat = mysql_query("SELECT DISTINCT Type FROM panden",$mysql) or die("De query op de database is mislukt!");
mysql_close($mysql) or die("Het verbreken van de verbinding met de MySQL-server is mislukt!");
?>
Type Huis:
<select name="Type">
<option value='Alle'>Alle</option>
<?php
while(list($Type) = mysql_fetch_row($resultaat))
{
	if($Type == $TypeLast){
		print("<option value='$Type' selected='selected'>$Type</option>");
	}
	else{
		print("<option value='$Type'>$Type</option>");
	}
}
?>
</select><br />


<?php
$mysql = mysql_connect("185.56.145.84","retorq1q","cnxdWK4H") or die("Fout: Er is geen verbinding met de MySQL-server tot stand gebracht!");
mysql_select_db("retorq1q_makelaars",$mysql) or die("Fout: Het openen van de database is mislukt!");
$resultaat = mysql_query("SELECT DISTINCT RichtingTuin FROM panden",$mysql) or die("De query op de database is mislukt!");
mysql_close($mysql) or die("Het verbreken van de verbinding met de MySQL-server is mislukt!");
?>
<br />
Richting Tuin:
<select name="RichtingTuin">
<option value='Alle'>Alle</option>
<?php
while(list($RichtingTuin) = mysql_fetch_row($resultaat))
{
	if($RichtingTuin == $RichtingTuinLast){
		print("<option value='$RichtingTuin' selected='selected'>$RichtingTuin</option>");
	}
	else{
		print("<option value='$RichtingTuin'>$RichtingTuin</option>");
	}
}
?>
</select><br />


<br />
Maximale prijs:<br />
<?php
print("<input type='number' value='$KostenMaxLast' name='KostenMax' maxlength='7'><br />");
?>

<br />
Minimale prijs:<br />
<?php
print("<input type='number' value='$KostenMinLast' name='KostenMin' maxlength='7'><br />");
?>

<br />
Aantal slaapkamers:<br />
<?php
print("<input type='number' value='$SlaapkamersLast' name='Slaapkamers' maxlength='7'><br />");
?>

<br />
Maximale oppervlakte huis:<br />
<?php
print("<input type='number' value='$OppHuisMaxLast' name='OppervlakteHuisMax' maxlength='7'><br />");
?>

<br />
Minimale oppervlakte huis:<br />
<?php
print("<input type='number' value='$OppHuisMinLast' name='OppervlakteHuisMin' maxlength='7'><br />");
?>

<br />
Maximale oppervlakte grond:<br />
<?php
print("<input type='number' value='$OppGrondMaxLast' name='OppervlakteGrondMax' maxlength='7'><br />");
?>

<br />
Minimale oppervlakte grond:<br />
<?php
print("<input type='number' value='$OppGrondMinLast' name='OppervlakteGrondMin' maxlength='7'><br />");
?>
<br />
<input type="submit" class="verzendknop" value="Zoek" />
</form>
<br />
<br />
<tab>
<?php
$KostenMax = $_POST["KostenMax"];
$KostenMin = $_POST["KostenMin"];
$Slaapkamers = $_POST["Slaapkamers"];
$Regio = $_POST["Regio"];
$Type = $_POST["Type"];
$RichtingTuin = $_POST["RichtingTuin"];
$OppHuisMin = $_POST["OppervlakteHuisMin"];
$OppHuisMax = $_POST["OppervlakteHuisMax"];
$OppGrondMin = $_POST["OppervlakteGrondMin"];
$OppGrondMax = $_POST["OppervlakteGrondMax"];

if(!$KostenMin){
	$KostenMin = 0;
}
if(!$KostenMax){
	$KostenMax = 99999999;
}

if(!$OppHuisMin){
	$OppHuisMin = 0;
}
if(!$OppHuisMax){
	$OppHuisMax = 99999999;
}

if(!$OppGrondMin){
	$OppGrondMin = 0;
}
if(!$OppGrondMax){
	$OppGrondMax = 99999999;
}

$query = array('1=1');
$query[] =  "Verkoopprijs BETWEEN " . addslashes($KostenMin) . " AND " . addslashes($KostenMax);
if (is_numeric($Slaapkamers)) {
  $query[] = "Slaapkamers = " . "'" . addslashes($Slaapkamers) . "'";
}
if ($Regio != "Alle" && $Regio != NULL)
{
	$query[] = " RegioPand = " . "'" . addslashes($Regio) . "'";
}
if ($Type != "Alle" && $Type != NULL){
	$query[] = "Type = " . "'" . addslashes($Type) . "'";
}
if ($RichtingTuin != "Alle" && $RichtingTuin != NULL){
	$query[] = "RichtingTuin = " . "'" . addslashes($RichtingTuin) . "'";
}
$query[] =  "OppervlakteHuis BETWEEN " . addslashes($OppHuisMin) . " AND " . addslashes($OppHuisMax);

$query[] =  "OppervlakteGrond BETWEEN " . addslashes($OppGrondMin) . " AND " . addslashes($OppGrondMax);

$query = join(" AND ", $query);

$mysql = mysql_connect("185.56.145.84","retorq1q","cnxdWK4H") or die("Fout: Er is geen verbinding met de MySQL-server tot stand gebracht!");
mysql_select_db("retorq1q_makelaars",$mysql) or die("Fout: Het openen van de database is mislukt!");
$resultaat = mysql_query("SELECT * FROM panden Where  $query",$mysql) or die("De query op de database is mislukt!");
mysql_close($mysql) or die("Het verbreken van de verbinding met de MySQL-server is mislukt!");

print("<table > <col width='170'><col width='170'><col width='170'><col width='170'><col width='170'><col width='1'><col width='170'><col width='170'><col width='170'><col width='170'> <tr><td>Adres</td>
		<td>Verkoopprijs</td>
		<td>Regio Pand</td><td>Type</td>
		<td>Postcode</td><td>Plaats</td><td>Oppervlakte</td><td>Slaapkamers</td>
		<td>Richting tuin</td><td>Plaatje</td></tr>");
	 while(list($PandID,$PandNaam,$VerkoperID,$VerkoopDatum,$Inkoopprijs,$Verkoopprijs,$Verkocht,$RegioPand,$Type,$Plaatje,$Postcode,$Plaats,$Oppervlakte,$Slaapkamers,$RichtingTuin) = mysql_fetch_row($resultaat))
	 {
		$Link = "<a href=\"PandDetails.php/?PandID=$PandID\">$PandNaam</a>";
		$Image = "<img src=$Plaatje alt=\"plaatje\" style=\"width:200px;height:100px;\">";
	  	echo("<tr><td>$Link</td><td>$Verkoopprijs</td>
		<td>$RegioPand</td><td>$Type</td><td>$Postcode</td>
		<td>$Plaats</td><td>$Oppervlakte</td><td>$Slaapkamers</td>
		<td>$RichtingTuin</td><td>$Image</td></tr><tr><td>_</td></tr>");
	 }
print("</table>");

?>
<tab/>
</center>

		<footer>
            <div class="row mediarij">
                <button type="button" class="instagram media"> </button>
                <button type="button" class="youtube media"> </button>
                <button type="button" class="facebook media"> </button>
                <button type="button" class="twitter media"> </button>
            </div>
            <p class="voet">&nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; Mondriaan Makelaars &nbsp; &nbsp; &nbsp; &nbsp; &nbsp;I &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; Arnhem &nbsp; &nbsp; &nbsp; &nbsp; &nbsp;I &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; Webdesign by Sappige Automatisering B.V.</p>
        </footer>
        <!-- /.container -->
        <!-- Bootstrap core JavaScript
    ================================================== -->
        <!-- Placed at the end of the document so the pages load faster -->
        <script src="assets/js/jquery.min.js"></script>
        <script src="bootstrap/js/bootstrap.min.js"></script>
        <!-- IE10 viewport hack for Surface/desktop Windows 8 bug -->
        <script src="assets/js/ie10-viewport-bug-workaround.js"></script>
    </body>
</html>
